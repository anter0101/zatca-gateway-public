import { Response } from 'express';

export class HeaderUtil {
  static addPaginationHeaders(
    res: Response,
    total: number,
    currentPage: number,
    nextPage: boolean,
  ): any {
    res.set('X-Total-Count', total.toString());
    res.set('Current-Page', currentPage.toString());
    res.set('Has-Next-Page', nextPage.toString());
  }
}
