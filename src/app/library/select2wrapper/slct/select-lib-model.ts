import { Observable } from "rxjs";

export const ListPosition = {
  Top: 'above',
  Bottom: 'below'
}

export default ListPosition;

export interface Select2SearchApi {
  search(searchValue: string): Observable<any>;
}
