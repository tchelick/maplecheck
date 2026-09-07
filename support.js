// Ko-fi support modal.
//
// Kept separate from script.js on purpose: script.js renders the company
// directory and depends on OWNERSHIP_DATA from extension-data.js, which only
// companies.html loads. Putting this here means the support button works on
// all four pages without shipping the whole dataset to every one of them.

const supportBtn = document.getElementById("support-btn");
const kofiModal = document.getElementById("kofi-modal");
const kofiClose = document.getElementById("kofi-modal-close");

if (supportBtn && kofiModal && kofiClose) {
  const open = () => kofiModal.classList.add("open");
  const close = () => kofiModal.classList.remove("open");

  supportBtn.addEventListener("click", open);
  kofiClose.addEventListener("click", close);

  // Click on the backdrop itself (not the dialog) closes it.
  kofiModal.addEventListener("click", (e) => {
    if (e.target === kofiModal) close();
  });

  // Escape closes it too — expected of any modal, and the only way out for
  // someone navigating by keyboard.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && kofiModal.classList.contains("open")) close();
  });
}
