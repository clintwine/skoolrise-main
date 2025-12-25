import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function BookRecommendationForm({ vendorId, vendorName, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    author: '',
    subject: '',
    grade_level: '',
    publisher: '',
    wholesale_price: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BookCatalog.create({
        ...data,
        vendor_id: vendorId,
        vendor_name: vendorName,
        status: 'Active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-catalog'] });
      alert('Book recommendation submitted successfully!');
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.isbn || !formData.wholesale_price) {
      alert('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      ...formData,
      wholesale_price: parseFloat(formData.wholesale_price),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Book Title *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter book title"
            required
          />
        </div>
        <div>
          <Label>ISBN *</Label>
          <Input
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            placeholder="Enter ISBN number"
            required
          />
        </div>
        <div>
          <Label>Author</Label>
          <Input
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            placeholder="Author name"
          />
        </div>
        <div>
          <Label>Grade Level *</Label>
          <Input
            value={formData.grade_level}
            onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
            placeholder="e.g., Grade 5, JSS 1"
            required
          />
        </div>
        <div>
          <Label>Subject</Label>
          <Input
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g., Mathematics, English"
          />
        </div>
        <div>
          <Label>Publisher</Label>
          <Input
            value={formData.publisher}
            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
            placeholder="Publisher name"
          />
        </div>
        <div>
          <Label>Wholesale Price ($) *</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.wholesale_price}
            onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the book"
          rows={4}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Submitting...' : 'Submit Recommendation'}
        </Button>
      </div>
    </form>
  );
}