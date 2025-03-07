(function ($) {
  "use strict";

  var url = "http://localhost:5000/api/permissions/";
  var permissiondata = [];

  $(document).ready(function () {
    var initDataTable = function () {
      $("#data-table").DataTable({
        dom: '<"html5buttons" B>lTfgitp',
        processing: true,
        serverSide: false,
        searchable: true,
        ordering: true,
        ajax: {
          url: url + "fetch_roles",
        },
        columns: [
          { data: "roleName" },
          {
            data: "permissions",
            render: function (data, type, row, meta) {
              var dataToRender = "";
              data.forEach((key) => {
                dataToRender +=
                  '<span style="cursor: pointer" data-roleid="' +
                  row.roleId +
                  '"class="badge badge-pill badge-light mb-1 mr-1 removePermission" data-id=" ' +
                  key.permissionId +
                  '">' +
                  key.permissionName +
                  "</span>";
              });
              return dataToRender;
            },
          },
          {
            data: "",
            render: function (data, type, row, meta) {
              var dataToRender =
                '<button class="btn btn-primary btn-xs editRole mr-1" data-roleid="' +
                row.roleId +
                '"><i class="icon icon-edit"></i> Edit</button><button class="btn btn-danger btn-xs removeRole mr-1" data-roleid="' +
                row.roleId +
                '"><i class="icon icon-trash"></i> Delete</button>';
              return dataToRender;
            },
          },
        ],
      });
    };

    // remove permission
    $(document).on("click", ".removePermission", function () {
      var pID = $(this).data("id");
      var rID = $(this).data("roleid");

      const swalWithBootstrapButtons = swal.mixin({
        confirmButtonClass: "btn btn-success mb-2",
        cancelButtonClass: "btn btn-danger mr-2 mb-2",
        buttonsStyling: false,
      });
      swalWithBootstrapButtons({
        title: "Are you sure?",
        text: "You want to remove this permission.",
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, remove it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      }).then((result) => {
        if (result.value) {
          // swalWithBootstrapButtons.showLoading();
          $.getJSON(url + "delete_permission/" + pID + "/" + rID).then(
            (res) => {
              $("#data-table").DataTable().clear().destroy();
              initDataTable();
            }
          );
        } else if (result.dismiss === swal.DismissReason.cancel) {
        }
      });
    });

    // edit role
    $(document).on("click", ".editRole", function () {
      var role = $(this).data("roleid");
      $.getJSON(url + "fetch_single_role_info/" + role).then((res) => {
        // Form
        var modal = `<form id="EditRoleForm" action="?" method="post">
                        <div class="form-group">
                            <label for="rolename">Role Name</label>
                            <input required id="rolename" value="${res.roleName}" class="form-control" type="text" placeholder="Role Name" name="roleName"/>
                            <input value="${role}" type="hidden" name="roleId"/>
                        </div>
                        <div class="form-group">
                            <label for="permissionsEdit">Permissions</label>
                            <select required id="permissionsEdit" class="form-control" multiple="multiple" style="width: 100%" name="permissions[]">
                            </select>
                        </div>
                        <div class="form-group text-center">
                            <button id="editSub" class="btn btn-success btn-block text-uppercase success-toast" type="submit">Edit Role</button>
                        </div>
                    </form>`;

        $(".editPermissionForm").html(modal);

        var option = "";
        res.permissions.forEach((key) => {
          option += `<option value="${key.permissionId}" selected="selected">${key.permissionName}</option>`;
        });
        $("select#permissionsEdit").append(option).trigger("change");
        $("select#permissionsEdit").select2({
          width: "resolve",
          data: permissiondata,
          placeholder: "Select A Permission",
        });

        $("#editPermissionsModal").modal("show");
      });
    });

    // remove role
    $(document).on("click", ".removeRole", function () {
      var roleId = $(this).data("roleid");
      const swalWithBootstrapButtons = swal.mixin({
        confirmButtonClass: "btn btn-success mb-2",
        cancelButtonClass: "btn btn-danger mr-2 mb-2",
        buttonsStyling: false,
      });
      swalWithBootstrapButtons({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        type: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      }).then((result) => {
        if (result.value) {
          // swalWithBootstrapButtons.showLoading();
          $.post(
            url + "delete_roles",
            { role_id: roleId },
            function (data, status) {
              $("#data-table").DataTable().clear().destroy();
              initDataTable();
              // swalWithBootstrapButtons(
              //     'Deleted!',
              //     'Your file has been deleted.',
              //     'success'
              // )
            }
          );
        } else if (result.dismiss === swal.DismissReason.cancel) {
          // swalWithBootstrapButtons(
          //     'Cancelled',
          //     'Your imaginary file is safe :)',
          //     'error'
          // )
        }
      });
    });

    initDataTable();

    $(".role-add")
      .css({ cursor: "pointer" })
      .on("click", function () {
        $("#permissionsmodal").modal("show");
      });

    $.getJSON(url + "fetch_permissions").then((res) => {
      res.forEach((key) => {
        permissiondata.push({ id: key.permissionId, text: key.permissionName });
      });

      $("select#permissions").select2({
        width: "resolve",
        data: permissiondata,
        placeholder: "Select A Permission",
      });
    });

    $("form#AddRoleForm").submit(function (e) {
      e.preventDefault();
      var data = $(this).serializeArray();
      $("#addSub")
        .prop("disabled", true)
        .html("<i class='icon icon-spin icon-spin2'></i>");

      $.ajax({
        url: url + "add_matrix",
        method: "POST",
        data: data,
        success: function (res) {
          $("#addSub").prop("disabled", false).html("Add Role");
          $("select#permissions").val(null).trigger("change");
          $("form#AddRoleForm")[0].reset();
          $("#permissionsmodal").modal("hide");
          const toast = swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
          });
          toast({
            type: "success",
            title: "Role was successfully created.",
          });

          $("#data-table").DataTable().clear().destroy();

          initDataTable();
        },
        error: function (err) {
          $("#addSub").prop("disabled", false).html("Add Role");
          const toast = swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
          });
          toast({
            type: "warning",
            title: err.responseText,
          });
        },
      });
    });

    $(document).on("submit", "form#EditRoleForm", function (e) {
      e.preventDefault();
      var data = $(this).serializeArray();
      $("#editSub")
        .prop("disabled", true)
        .html("<i class='icon icon-spin icon-spin2'></i>");
      $.ajax({
        url: url + "edit_matrix",
        method: "POST",
        data: data,
        success: function (res) {
          $("#editSub").prop("disabled", false).html("Edit Role");

          $("#editPermissionsModal").modal("hide");
          const toast = swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
          });
          toast({
            type: "success",
            title: "Role was successfully edited.",
          });

          $("#data-table").DataTable().clear().destroy();

          initDataTable();
        },
        error: function (err) {
          $("#editSub").prop("disabled", false).html("Edit Role");
          const toast = swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
          });
          toast({
            type: "warning",
            title: "All fields are required.",
          });
        },
      });
    });
  });
})(jQuery);
