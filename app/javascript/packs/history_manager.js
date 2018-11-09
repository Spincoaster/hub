export function restoreHistory() {
  var previousLocation = localStorage.getItem("last_location");
  if (previousLocation !== null && previousLocation !== window.location.href) {
    top.location.href = previousLocation + '?restore_mode';
  }
  localStorage.removeItem("last_location");
};

export function setupHistory() {
  const links = document.links;
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    if (link.href.toLowerCase().indexOf('javascript') === -1) {
      link.addEventListener('click', function(e) {
        if (this.target !== '_blank') {
          top.location.href = this.href;
          e.returnValue = false;
        } else {
          localStorage.setItem("last_location", window.location.href);
          window.open(this.href);
        }
      }, false);
    }
  }
  if (document.referrer !== '' && top.location.href.indexOf('restore_mode') === -1) {
    $('.back').show();
  }
}
