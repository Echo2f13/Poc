import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  private readonly reviews: Review[] = [];
  private idCounter = 1;

  create(createReviewDto: CreateReviewDto): Review {
    const newReview: Review = {
      id: this.idCounter++,
      ...createReviewDto,
    };
    this.reviews.push(newReview);
    return newReview;
  }

  findAll(): Review[] {
    return this.reviews;
  }

  findByProductId(productId: number): Review[] {
    return this.reviews.filter(review => review.productId === productId);
  }
}
