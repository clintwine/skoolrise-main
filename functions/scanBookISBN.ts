import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isbn, action } = await req.json();

    if (!isbn) {
      return Response.json({ error: 'isbn is required' }, { status: 400 });
    }

    // Check if book already exists
    const existingBooks = await base44.entities.BookCatalog.filter({ isbn: isbn });
    if (existingBooks.length > 0) {
      return Response.json({
        success: false,
        error: 'Book already exists in catalog',
        book: existingBooks[0]
      }, { status: 409 });
    }

    // Fetch book details from Google Books API
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch book details from Google Books API' }, { status: 500 });
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return Response.json({ error: 'Book not found in Google Books database' }, { status: 404 });
    }

    const bookInfo = data.items[0].volumeInfo;
    
    const bookDetails = {
      title: bookInfo.title || 'Unknown Title',
      author: bookInfo.authors?.join(', ') || 'Unknown Author',
      publisher: bookInfo.publisher || 'Unknown Publisher',
      isbn: isbn,
      publication_year: bookInfo.publishedDate?.substring(0, 4) || null,
      category: bookInfo.categories?.join(', ') || 'General',
      description: bookInfo.description || '',
      cover_image_url: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || null,
      page_count: bookInfo.pageCount || null,
      language: bookInfo.language || 'en'
    };

    // If action is 'confirm', add to catalog
    if (action === 'confirm') {
      const catalogEntry = await base44.entities.BookCatalog.create({
        ...bookDetails,
        status: 'Available',
        added_by_user_id: user.id,
        added_by_name: user.full_name || user.email
      });

      return Response.json({
        success: true,
        message: 'Book added to catalog successfully',
        book: catalogEntry
      });
    }

    // Otherwise, just return book details for confirmation
    return Response.json({
      success: true,
      book: bookDetails
    });

  } catch (error) {
    console.error('Error in scanBookISBN:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});