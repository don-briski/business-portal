import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Configuration } from '../../../model/configuration';
import { ConfigurationService } from '../../../service/configuration.service';
import { AuthService } from '../../../service/auth.service';
import { UserService } from '../../../service/user.service';
import { TokenRefreshErrorHandler } from '../../../service/TokenRefreshErrorHandler';

@Component({
  selector: 'app-notes-page',
  templateUrl: './notes-page.component.html',
  styleUrls: ['./notes-page.component.scss']
})
export class NotesPageComponent implements OnInit {


  public AddNoteForm: UntypedFormGroup;
  public EditNoteForm: UntypedFormGroup;
  public ViewNoteForm: UntypedFormGroup;
  notes: Configuration[];
  public loggedInUser: any;
  pagination = {
    pageNum : 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: []
  };

  currentview: any;
  requestLoader: boolean;
  loader = false;
  dataTable: any;

  selectedNoteType: any;
  selectedNoteTypeArray: any;

  currentuser: any;
  currentuserid: any;
  ownerInformation: any;
  currentdate: any;
  currentuserbranchid: any;




  public NoteTypeArray: Array<string> = ['Rejection Reason', 'Note to Applicant', 'General' ];


  constructor(
    private configurationService: ConfigurationService,
    public authService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private userService: UserService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) { }

  ngOnInit() {

    this.loggedInUser = this.authService.decodeToken();


    this.getUserPromise().then(next => {

    this.currentview = 1;
    this.requestLoader = true;
    this.addNoteFormInit();


    this.switchviews(this.currentview);

  }).catch(err => {
    // swal.fire('Error', 'User not Loaded');
    // if (this.httpFailureError) { swal.fire('Error', 'User not Loaded.', 'error'); }
});

  }

  switchviews(view) {

    if (view === 1) {
      this.currentview = 1;
      this.getNotes();
    }


  }

  getNotes(pageNum = this.pagination.pageNum, filter = null) {
    this.notes = [];


                  // paginated section
    this.pagination.pageNum = pageNum;
    if ( pageNum < 1) {
                    this.pagination.pageNum = 1;
                  }
    if ( pageNum > this.pagination.maxPage) {
                    this.pagination.pageNum = this.pagination.maxPage || 1;
                  }

    const paginationmodel = {
                    BranchId: 1,
                    pageNumber: this.pagination.pageNum,
                    pageSize: this.pagination.pageSize,
                    filter: this.pagination.searchTerm
                  };

    this.configurationService.spoolNotes(paginationmodel).subscribe((response) => {



    this.notes = response.body.value.data;


    this.pagination.maxPage = response.body.value.pages;
    this.pagination.totalRecords = response.body.value.totalRecords;
    this.pagination.count = this.notes.length;
    this.pagination.jumpArray = Array(this.pagination.maxPage);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                      this.pagination.jumpArray[i] = i + 1;
                    }

    this.chRef.detectChanges();
    const table: any = $('#industriestable');
    this.dataTable = table.DataTable({
                      aaSorting: [],
                      paging: false,
                      searching: false,
                      bInfo: false,
                      order: []  }  );

    this.requestLoader = false;
      }, error => {
        // swal.fire({   type: 'error',   title: 'Error',   text: error, });
       swal.fire('Error', error.error, 'error');
      });

  }


  openModal(content) {
    this.modalService.open(content, {size: 'lg', centered: true, ariaLabelledBy: 'modal-basic-title'});
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  addNoteFormInit() {

    this.AddNoteForm = new UntypedFormGroup({
      NoteName: new UntypedFormControl('', [Validators.required]),
      NoteDescription: new UntypedFormControl(''),
      NoteType: new UntypedFormControl(''),
      UserId: new UntypedFormControl(''),
      BranchId: new UntypedFormControl(''),
      Status: new UntypedFormControl(''),
    });
  }

  openEditModal(content, data) {


      this.EditNoteForm = new UntypedFormGroup({
        NoteId: new UntypedFormControl(data.noteId, [Validators.required]),
        NoteName: new UntypedFormControl(data.noteName, [Validators.required]),
        NoteDescription: new UntypedFormControl(data.noteDescription, [Validators.required]),
        NoteType: new UntypedFormControl(),
        UserId: new UntypedFormControl(data.UserId),
        BranchId: new UntypedFormControl(data.BranchId),
        Status: new UntypedFormControl(data.status, [Validators.required])

      });

      this.selectedNoteTypeArray = [{id: data.noteType, text: data.noteType}];
      this.selectedNoteType = data.noteType;

      this.modalService.open(content, {centered: true, ariaLabelledBy: 'modal-basic-title'});

    }

  openViewModal(content, data) {

        this.ViewNoteForm = new UntypedFormGroup({
          NoteId: new UntypedFormControl(data.noteId),
          NoteName: new UntypedFormControl(data.noteName),
          NoteDescription: new UntypedFormControl(data.noteDescription),
          NoteType: new UntypedFormControl(data.noteType),
          Status: new UntypedFormControl(data.status, [Validators.required])

        });


        this.modalService.open(content, {centered: true, ariaLabelledBy: 'modal-basic-title'});

      }

  submitEditNoteForm(val: any) {
    if (this.EditNoteForm.valid) {
      this.loader = true;

      this.EditNoteForm.controls['NoteType'].patchValue(this.selectedNoteType);
      this.EditNoteForm.controls['UserId'].patchValue(this.currentuserid);
      this.EditNoteForm.controls['BranchId'].patchValue(this.currentuserbranchid);
      this.configurationService.EditNote(this.EditNoteForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Note: ' + res.noteName + ' has been updated', title: 'Successful'});
          this.modalService.dismissAll();
          this.dataTable.destroy();
          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;
          // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
         swal.fire('Error', err.error, 'error');
        }
      );
    }
  }

  submitNoteForm(val: any) {
    if (this.AddNoteForm.valid) {

      this.loader = true;

      this.AddNoteForm.controls['NoteType'].patchValue(this.selectedNoteType);
      this.AddNoteForm.controls['UserId'].patchValue(this.currentuserid);
      this.configurationService.createNote( this.AddNoteForm.value).subscribe(
        (res) => {
          swal.fire({ type: 'success', text: 'Note has been added', title: 'Successful'});
          this.modalService.dismissAll();
          this.AddNoteForm.reset();
          this.dataTable.destroy();
          this.switchviews(1);
          this.loader = false;
        },
        (err) => {
          this.loader = false;
          // swal.fire({   type: 'error',   title: 'Error',   text: err.error });
         swal.fire('Error', err.error, 'error');
        }
      );
    }
  }

  selected(value) {
    this.selectedNoteType = value.text;
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    this.dataTable.destroy();
    // tslint:disable-next-line:radix
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) { this.getNotes(pageNumber, filter); return; }
    filter = filter.trim();
    this.pagination.searchTerm = (filter === '') ? null : filter;
    this.getNotes(pageNumber, filter);
  }

  getUserPromise() {
    return new Promise( (resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(user => {
        this.currentuser = user.body;
        this.currentuserid =  this.currentuser.userId;
        this.currentuserbranchid = this.currentuser.branchId;
        resolve(user);
      }, err => {
        reject(err);
      });
    });
  }







}
