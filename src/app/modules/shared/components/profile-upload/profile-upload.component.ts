import { Component, EventEmitter, Input, Output } from "@angular/core";
import { LoanProfile } from "../../../loan-section/loan.types";
import { isFileSizeValid, isImage } from "../../helpers/generic.helpers";
import Swal from "sweetalert2";

@Component({
  selector: "lnd-profile-upload",
  templateUrl: "./profile-upload.component.html",
  styleUrls: ["./profile-upload.component.scss"],
})
export class ProfileUploadComponent {
  @Input() profile: LoanProfile;
  @Input() allowEdit = true;
  @Output() savedImg = new EventEmitter();

  showPopup = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });

  constructor() {}

  handleProfileImgUpload(filelist: FileList): void {
    this.profile = { newProfileImg: [] };
    for (let i = 0; i < filelist.length; i++) {
      if (!isFileSizeValid(filelist[i], 1)) {
        this.toast.fire({
          type: "error",
          title: "File size must not be more than 1MB",
        });
        return;
      }
      if (!isImage(filelist[i])) {
        this.toast.fire({
          type: "error",
          title: "File must be a valid Image (JPEG/PNG)",
        });
        return;
      }
      this.profile?.newProfileImg.push(filelist.item(i));
    }
    this.profile.fileName = filelist[0].name;
    let reader = new FileReader();

    reader.onload = (event) => {
      this.profile.base64Img = event.target.result;
    };

    reader.readAsDataURL(filelist[0]);
  }

  saveProfileImage($event) {
    $event.preventDefault();
    if (this.profile.base64Img) {
      this.profile.imgUrl = this.profile.base64Img;
      this.savedImg.emit(this.profile.newProfileImg);
      this.showPopup = false;
    }
  }
}
