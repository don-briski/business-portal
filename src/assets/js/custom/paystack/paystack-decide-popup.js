function payWithPaystack(payload) {
  return new Promise((resolve, reject) => {
    let handler = PaystackPop.setup({
      key: payload.key,
      email: payload.email,
      amount: payload.amount * 100,
      ref: "" + Math.floor(Math.random() * 1000000000 + 1),
      onClose: function () {
        alert("Window closed.");
      },
      callback: function (response) {
        resolve(response.reference);
      },
    });
    handler.openIframe();
  });
}
