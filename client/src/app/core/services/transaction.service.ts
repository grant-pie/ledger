import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Transaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from '../../shared/types/transaction.types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  getOne(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateTransactionPayload): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, payload);
  }

  update(
    id: string,
    payload: UpdateTransactionPayload,
  ): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
