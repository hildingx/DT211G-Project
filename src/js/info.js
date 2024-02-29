//Öppna eller stäng inforuta vid klick på ?
document.getElementById('info-trigger').addEventListener('click', function() {
  let infoContent = document.getElementById('info-content');
  let expanded = this.getAttribute('aria-expanded') === 'true';
  this.setAttribute('aria-expanded', !expanded);
  infoContent.style.display = expanded ? 'none' : 'block';
});