import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/hooks/useSchoolContext';
import { addSchoolFilter } from '@/utils/schoolFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, BookOpen, Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function VendorProfile() {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({
    business_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [bookData, setBookData] = useState({
    title: '',
    isbn: '',
    author: '',
    subject: '',
    grade_level: '',
    publisher: '',
    wholesale_price: '',
    description: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      let vendorRecord = null;
      if (currentUser.vendor_profile_id) {
        vendorRecord = await base44.entities.Vendor.get(currentUser.vendor_profile_id);
      } else if (currentUser.id) {
        const vendors = await base44.entities.Vendor.filter({ user_id: currentUser.id });
        vendorRecord = vendors[0] || null;
      }
      if (vendorRecord) {
        setVendor(vendorRecord);
        setProfileData(vendorRecord);
      }
    };
    fetchUser();
  }, []);

  const { data: bookCatalog = [] } = useQuery({
    queryKey: ['vendor-books', vendor?.id],
    queryFn: async () => {
      const allBooks = await base44.entities.BookCatalog.list();
      return allBooks.filter(book => book.vendor_id === vendor?.id);
    },
    enabled: !!vendor?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.Vendor.update(vendor.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-books'] });
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    },
  });

  const createBookMutation = useMutation({
    mutationFn: (data) => base44.entities.BookCatalog.create({
      ...data,
      vendor_id: vendor.id,
      vendor_name: vendor.business_name,
      status: 'Active',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-books'] });
      setIsRecommendationOpen(false);
      resetBookForm();
      alert('Book recommendation submitted successfully!');
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BookCatalog.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-books'] });
      setIsRecommendationOpen(false);
      resetBookForm();
      alert('Book updated successfully!');
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id) => base44.entities.BookCatalog.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-books'] });
    },
  });

  const resetBookForm = () => {
    setBookData({
      title: '',
      isbn: '',
      author: '',
      subject: '',
      grade_level: '',
      publisher: '',
      wholesale_price: '',
      description: '',
    });
    setEditingBook(null);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (editingBook) {
      updateBookMutation.mutate({ id: editingBook.id, data: bookData });
    } else {
      createBookMutation.mutate(bookData);
    }
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setBookData(book);
    setIsRecommendationOpen(true);
  };

  const handleDeleteBook = (bookId) => {
    if (confirm('Are you sure you want to delete this book recommendation?')) {
      deleteBookMutation.mutate(bookId);
    }
  };

  if (!user || !vendor) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vendor Profile</h1>
        <p className="text-gray-600 mt-1">Manage your business information and book recommendations</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Business Information
            </CardTitle>
            <Button 
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              variant="outline"
            >
              {isEditingProfile ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Name</Label>
                  <Input value={profileData.business_name} onChange={(e) => setProfileData({...profileData, business_name: e.target.value})} />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input value={profileData.contact_person} onChange={(e) => setProfileData({...profileData, contact_person: e.target.value})} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={profileData.notes} onChange={(e) => setProfileData({...profileData, notes: e.target.value})} rows={3} />
                </div>
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <p><span className="font-semibold">Business Name:</span> {vendor.business_name}</p>
              <p><span className="font-semibold">Contact Person:</span> {vendor.contact_person}</p>
              <p><span className="font-semibold">Email:</span> {vendor.email}</p>
              <p><span className="font-semibold">Phone:</span> {vendor.phone || 'N/A'}</p>
              <p><span className="font-semibold">Category:</span> {vendor.category}</p>
              <p><span className="font-semibold">Address:</span> {vendor.address || 'N/A'}</p>
              {vendor.notes && <p><span className="font-semibold">Notes:</span> {vendor.notes}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Book Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Book Recommendations ({bookCatalog.length})
            </CardTitle>
            <Button onClick={() => { resetBookForm(); setIsRecommendationOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Recommend Book
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookCatalog.map((book) => (
              <div key={book.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{book.title}</h3>
                    <p className="text-sm text-gray-600">Author: {book.author}</p>
                    <p className="text-sm text-gray-600">ISBN: {book.isbn}</p>
                    <p className="text-sm text-gray-600">Subject: {book.subject} | Grade: {book.grade_level}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">Wholesale: ${book.wholesale_price}</p>
                    {book.description && (
                      <p className="text-sm text-gray-600 mt-2">{book.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditBook(book)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteBook(book.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Book Recommendation Dialog */}
      <Dialog open={isRecommendationOpen} onOpenChange={setIsRecommendationOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{editingBook ? 'Edit Book' : 'Recommend a Book'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBookSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Book Title *</Label>
                <Input value={bookData.title} onChange={(e) => setBookData({...bookData, title: e.target.value})} required />
              </div>
              <div>
                <Label>ISBN *</Label>
                <Input value={bookData.isbn} onChange={(e) => setBookData({...bookData, isbn: e.target.value})} required />
              </div>
              <div>
                <Label>Author</Label>
                <Input value={bookData.author} onChange={(e) => setBookData({...bookData, author: e.target.value})} />
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={bookData.subject} onChange={(e) => setBookData({...bookData, subject: e.target.value})} />
              </div>
              <div>
                <Label>Grade Level</Label>
                <Input value={bookData.grade_level} onChange={(e) => setBookData({...bookData, grade_level: e.target.value})} />
              </div>
              <div>
                <Label>Publisher</Label>
                <Input value={bookData.publisher} onChange={(e) => setBookData({...bookData, publisher: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Your Wholesale Price *</Label>
                <Input type="number" step="0.01" value={bookData.wholesale_price} onChange={(e) => setBookData({...bookData, wholesale_price: e.target.value})} required />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={bookData.description} onChange={(e) => setBookData({...bookData, description: e.target.value})} rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsRecommendationOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingBook ? 'Update Book' : 'Submit Recommendation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}