// Toast notification function
function showToast(message, type = "success") {
    toastr.options = {
      closeButton: true,
      progressBar: true,
      positionClass: "toast-top-right",
      showDuration: "300",
      hideDuration: "1000",
      timeOut: "5000",
    };
    toastr[type](message);
  }