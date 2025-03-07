import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CaseNote, CreateCaseNote, PROSPECT_CASE_TYPE } from '../../../crm.types';
import { CrmService } from '../../../crm.service';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'lnd-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss']
})
export class NoteComponent implements OnInit, OnDestroy {
  @Input() secondaryColor: string;
  @Input() selectedCaseId: number;
  @Input() caseType:PROSPECT_CASE_TYPE;
  @Input() permissions:string[] = [];

  private unsubscriber$ = new Subject<void>();

  showAddNoteForm = false;
  showAddNoteBtnSection = true;
  notes: string;
  isProcessing = false;
  isRetrievingNotes = false;
  isDeletingNote = false;
  caseNotes:CaseNote[] = [];
  charLimit = 250;

  constructor(private crmService:CrmService){}

  ngOnInit(): void {
    this.getCaseNotes(this.selectedCaseId);
  }

  editNote(note:CaseNote){
    note.isEdit = true;
    this.showAddNoteBtnSection = false;
    this.notes = note.text;
  }

  getCaseNotes(id: number) {
    this.isRetrievingNotes = true;
    this.crmService
      .getCaseNotes(id)
      .pipe(map(res => res.body.data.map(note => ({...note,isEdit:false}))),takeUntil(this.unsubscriber$))
      .subscribe({
        next: (notes) => {
          this.caseNotes = notes;
          this.isRetrievingNotes = false;
        },
      });
  }

  addNote(id?:number) {
    this.isProcessing = true;
    let payload: CreateCaseNote = {
      prospectCaseId: this.selectedCaseId,
      text: this.notes,
    };
    if (id) {
      payload.id = id;
    }
    this.crmService
      .createCaseNote(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.getCaseNotes(this.selectedCaseId)
          this.isProcessing = false;
          this.showAddNoteForm = false;
          this.showAddNoteBtnSection = true;
          this.notes = "";
        },
        error: () => {
          this.isProcessing = false;
        },
      });
  }

  deleteNote(id:number){
    this.isDeletingNote = true;
    this.crmService.deleteCaseNote(id).pipe(takeUntil(this.unsubscriber$)).subscribe({
      next:() => {
        this.isDeletingNote = false;
        this.getCaseNotes(this.selectedCaseId);
      },
      error:() => {
        this.isDeletingNote = false;
      }
    })
  }

  setNote(value:string){
    this.notes = value;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
