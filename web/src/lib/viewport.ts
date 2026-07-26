// 모바일(특히 iOS Safari)에서 키보드가 열릴 때 생기는 확대·화면 밀림을 막는다.
//
// 1) --app-height: visualViewport 높이를 CSS 변수로 반영해 앱이 "실제 보이는 영역"만 차지하게 한다.
//    - iOS Safari: dvh 가 키보드에 반응하지 않으므로 visualViewport 로 직접 계산
//    - Android Chrome: interactive-widget=resizes-content 와 함께 동작
// 2) 스크롤 되돌리기: iOS 는 입력창에 포커스가 가면 문서를 위/오른쪽으로 스크롤해
//    position:fixed 인 앱 컨테이너까지 밀어버린다. 스크롤을 (0,0)으로 되돌린다.
// 3) 핀치 줌 차단: iOS Safari 는 viewport 메타의 user-scalable=no 를 무시하므로
//    gesture 이벤트를 직접 막는다.

/** scale 이 1보다 크면 사용자가 실제로 확대한 상태 → 패닝을 방해하지 않는다. */
function isUnzoomed(): boolean {
  const scale = window.visualViewport?.scale ?? 1;
  return scale <= 1.01;
}

/** iOS 가 키보드 때문에 밀어놓은 문서 스크롤을 원위치. */
function resetDocumentScroll(): void {
  if (!isUnzoomed()) return;
  if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
  const el = document.scrollingElement;
  if (el) {
    if (el.scrollLeft !== 0) el.scrollLeft = 0;
    if (el.scrollTop !== 0) el.scrollTop = 0;
  }
}

export function initViewportFix(): void {
  const root = document.documentElement;
  const vv = window.visualViewport;

  const apply = () => {
    const height = vv ? vv.height : window.innerHeight;
    root.style.setProperty('--app-height', `${height}px`);
    resetDocumentScroll();
  };

  apply();

  if (vv) {
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
  }
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);

  // 입력창 포커스 직후 iOS 가 문서를 스크롤한다. 여러 시점에서 되돌린다.
  window.addEventListener('focusin', () => {
    resetDocumentScroll();
    requestAnimationFrame(resetDocumentScroll);
    setTimeout(resetDocumentScroll, 100);
    setTimeout(resetDocumentScroll, 300);
  });
  window.addEventListener('focusout', () => {
    requestAnimationFrame(resetDocumentScroll);
    setTimeout(resetDocumentScroll, 100);
  });

  // iOS Safari 핀치 줌 차단 (meta user-scalable=no 를 무시하기 때문)
  const blockGesture = (e: Event) => e.preventDefault();
  document.addEventListener('gesturestart', blockGesture, { passive: false });
  document.addEventListener('gesturechange', blockGesture, { passive: false });
  document.addEventListener('gestureend', blockGesture, { passive: false });

  // 손가락 두 개 이상의 터치로 인한 확대 차단
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false },
  );
}
