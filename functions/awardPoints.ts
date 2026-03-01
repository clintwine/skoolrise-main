import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 5000, 15000];
const LEVEL_NAMES = ['Beginner', 'Explorer', 'Achiever', 'Champion', 'Legend', 'Master'];

function calculateLevel(lifetimePoints) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (lifetimePoints >= LEVEL_THRESHOLDS[i]) {
      return { level: i + 1, name: LEVEL_NAMES[i] };
    }
  }
  return { level: 1, name: 'Beginner' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      student_id, 
      student_name, 
      points, 
      type, 
      category, 
      description,
      reference_type,
      reference_id 
    } = await req.json();

    if (!student_id || !points || !type || !category) {
      return Response.json({ 
        error: 'student_id, points, type, and category are required' 
      }, { status: 400 });
    }

    // Get or create StudentPoints record
    let studentPoints = await base44.asServiceRole.entities.StudentPoints.filter({ 
      student_id 
    });

    let pointsRecord;
    if (studentPoints.length === 0) {
      // Create new record
      pointsRecord = await base44.asServiceRole.entities.StudentPoints.create({
        student_id,
        student_name: student_name || '',
        total_points: 0,
        available_points: 0,
        lifetime_points: 0,
        level: 1,
        level_name: 'Beginner',
      });
    } else {
      pointsRecord = studentPoints[0];
    }

    // Calculate new totals
    const isEarning = type === 'earned' || type === 'bonus';
    const newAvailable = (pointsRecord.available_points || 0) + (isEarning ? points : -points);
    const newLifetime = isEarning 
      ? (pointsRecord.lifetime_points || 0) + points 
      : pointsRecord.lifetime_points || 0;

    // Calculate new level
    const { level, name: levelName } = calculateLevel(newLifetime);

    // Update StudentPoints
    await base44.asServiceRole.entities.StudentPoints.update(pointsRecord.id, {
      total_points: newAvailable,
      available_points: newAvailable,
      lifetime_points: newLifetime,
      level,
      level_name: levelName,
    });

    // Create transaction record
    const transaction = await base44.asServiceRole.entities.PointTransaction.create({
      student_id,
      student_name: student_name || '',
      points: isEarning ? points : -points,
      type,
      category,
      description: description || '',
      reference_type: reference_type || '',
      reference_id: reference_id || '',
      awarded_by: user.email,
    });

    // Check for level up notification
    if (level > (pointsRecord.level || 1)) {
      await base44.asServiceRole.entities.InAppNotification.create({
        user_id: student_id,
        title: '🎉 Level Up!',
        message: `Congratulations! You've reached Level ${level}: ${levelName}!`,
        type: 'success',
        link: 'RewardsStore',
        is_read: false,
      });
    }

    return Response.json({ 
      success: true, 
      transaction,
      newBalance: newAvailable,
      newLevel: level,
      levelName,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});