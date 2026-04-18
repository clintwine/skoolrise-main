import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Award, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function RewardsStore() {
  const [user, setUser] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const schoolTenantId = studentProfile?.school_tenant_id || null;

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards', schoolTenantId],
    queryFn: () => base44.entities.Reward.filter(addSchoolFilter({}, schoolTenantId)),
    enabled: !!studentProfile,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Student.filter({ user_id: user.id });
    },
    enabled: !!user?.id,
  });

  const studentProfile = students[0];

  const { data: behaviors = [] } = useQuery({
    queryKey: ['my-behaviors', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      return await base44.entities.Behavior.filter({ student_id: studentProfile.id });
    },
    enabled: !!studentProfile?.id,
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['my-redemptions', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      return await base44.entities.RewardRedemption.filter({ student_id: studentProfile.id });
    },
    enabled: !!studentProfile?.id,
  });

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      return base44.entities.RewardRedemption.create({
        student_id: studentProfile.id,
        student_name: `${studentProfile.first_name} ${studentProfile.last_name}`,
        reward_id: reward.id,
        reward_name: reward.name,
        points_spent: reward.points_required,
        redemption_date: new Date().toISOString(),
        status: 'Pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
      setSelectedReward(null);
      alert('Reward redeemed successfully! Please see your teacher to collect.');
    },
  });

  const myPoints = behaviors
    .filter(b => b.type === 'Merit')
    .reduce((sum, b) => sum + (b.points || 0), 0);

  const pointsSpent = redemptions.reduce((sum, r) => sum + r.points_spent, 0);
  const availablePoints = myPoints - pointsSpent;

  const canAfford = (reward) => availablePoints >= reward.points_required;

  if (!user) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rewards Store</h1>
        <p className="text-gray-600 mt-1">Redeem your merit points for rewards</p>
      </div>

      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Your Available Points</p>
              <p className="text-4xl font-bold">{availablePoints}</p>
              <p className="text-white/60 text-sm mt-1">Total earned: {myPoints} | Spent: {pointsSpent}</p>
            </div>
            <Award className="w-16 h-16 text-white/50" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.filter(r => r.is_active).map((reward) => (
          <Card key={reward.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Gift className="w-8 h-8 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-800">{reward.points_required} pts</Badge>
              </div>
              <CardTitle className="mt-2">{reward.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
              <Button
                onClick={() => setSelectedReward(reward)}
                disabled={!canAfford(reward)}
                className={`w-full ${canAfford(reward) ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300'}`}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {canAfford(reward) ? 'Redeem' : 'Not Enough Points'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {redemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {redemptions.map((redemption) => (
                <div key={redemption.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{redemption.reward_name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(redemption.redemption_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={redemption.status === 'Fulfilled' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                      {redemption.status}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">{redemption.points_spent} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <Gift className="w-16 h-16 text-purple-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-2">{selectedReward.name}</h3>
                <p className="text-gray-600 mb-4">{selectedReward.description}</p>
                <Badge className="bg-purple-100 text-purple-800 text-lg">{selectedReward.points_required} points</Badge>
              </div>
              <p className="text-sm text-gray-600 text-center">
                After redemption, you'll have {availablePoints - selectedReward.points_required} points remaining.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedReward(null)} className="flex-1">Cancel</Button>
                <Button onClick={() => redeemMutation.mutate(selectedReward)} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Confirm Redemption
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}