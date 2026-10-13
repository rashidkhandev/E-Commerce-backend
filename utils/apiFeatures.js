/**
 * Utility class for advanced MongoDB querying:
 * Search, Filtering, Sorting, Field Limiting, and Pagination.
 */
export class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search() {
    if (this.queryString.keyword) {
      const keyword = this.queryString.keyword.trim();
      const searchRegex = { $regex: keyword, $options: 'i' };
      
      this.query = this.query.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { shortDescription: searchRegex },
          { brand: searchRegex },
          { sku: searchRegex },
        ],
      });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Handle price range filters: { price: { gte: 100, lte: 500 } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const parsedQuery = JSON.parse(queryStr);

    // Filter by category slug or ID if provided
    if (parsedQuery.category) {
      // Category can be slug or ObjectId
      this.query = this.query.find({
        $or: [
          { category: parsedQuery.category },
          { 'category.slug': parsedQuery.category },
        ],
      });
      delete parsedQuery.category;
    }

    // Availability filter
    if (parsedQuery.inStock === 'true' || parsedQuery.inStock === true) {
      parsedQuery.stock = { $gt: 0 };
      delete parsedQuery.inStock;
    }

    // Minimum rating filter
    if (parsedQuery.minRating) {
      parsedQuery.rating = { $gte: Number(parsedQuery.minRating) };
      delete parsedQuery.minRating;
    }

    // Brand case-insensitive match
    if (parsedQuery.brand) {
      parsedQuery.brand = { $regex: new RegExp(`^${parsedQuery.brand}$`, 'i') };
    }

    this.query = this.query.find(parsedQuery);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort;
      switch (sortBy) {
        case 'price-asc':
        case 'price_low':
          this.query = this.query.sort('price');
          break;
        case 'price-desc':
        case 'price_high':
          this.query = this.query.sort('-price');
          break;
        case 'rating':
        case 'highest_rated':
          this.query = this.query.sort('-rating -reviewCount');
          break;
        case 'popular':
        case 'bestseller':
          this.query = this.query.sort('-bestseller -reviewCount -rating');
          break;
        case 'discount':
          this.query = this.query.sort('-discountPercentage');
          break;
        case 'oldest':
          this.query = this.query.sort('createdAt');
          break;
        case 'newest':
        default:
          this.query = this.query.sort('-createdAt');
          break;
      }
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  paginate(totalDocs = 0) {
    const page = Math.max(1, parseInt(this.queryString.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(this.queryString.limit, 10) || 12));
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.paginationMeta = {
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalDocs / limit),
      totalResults: totalDocs,
      hasNextPage: page * limit < totalDocs,
      hasPrevPage: page > 1,
    };

    return this;
  }
}
