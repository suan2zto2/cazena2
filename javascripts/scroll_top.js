document.addEventListener('click', function (e) {
  var link = e.target.closest('.md-nav__link--active');
  if (!link) return;
  if ((link.getAttribute('href') || '').startsWith('#')) return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 레퍼런스 페이지에서 왼쪽 nav TOC 항목 숨기기
function hideReferenceToc() {
  if (window.location.pathname.includes('/references/')) {
    // H2 항목은 유지, H3 이하 중첩 nav만 숨김
    document.querySelectorAll('.md-nav--primary .md-nav--secondary .md-nav__item > .md-nav').forEach(function (el) {
      el.style.display = 'none';
    });
  }
}

// 초기 로드 + MkDocs Material SPA 내비게이션 대응
if (typeof document$ !== 'undefined') {
  document$.subscribe(hideReferenceToc);
} else {
  document.addEventListener('DOMContentLoaded', hideReferenceToc);
}
