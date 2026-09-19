import { BaseEntity } from './base.entity';
import { Type, Expose as JsonProperty } from 'class-transformer';

export class Sort {
  public property: string;
  public direction: 'ASC' | 'DESC';
  constructor(sort: string) {
    if (sort) {
      const [property, direction] = sort.split(',');
      this.property = property;
      // Ensure direction is valid before assigning
      const upperDirection = direction?.toUpperCase();
      this.direction = upperDirection === 'DESC' ? 'DESC' : 'ASC';
    }
  }

  asOrder(): Record<string, 'ASC' | 'DESC'> {
    const order = {};
    order[this.property] = this.direction;
    return order;
  }
}

export class PageRequest {
  @JsonProperty()
  page = 0;
  @JsonProperty()
  size = 20;
  @Type(() => Sort)
  sort: Sort = new Sort('id,ASC');

  constructor(page: number | string, size: number | string, sort: string) {
    this.page = +page - 1 || this.page;
    this.size = +size || this.size;
    this.sort = sort ? new Sort(sort) : this.sort;
  }
}

export class Page<T extends BaseEntity> {
  constructor(
    public content: T[],
    public total: number,
    public pageable: PageRequest,
  ) {}
}
