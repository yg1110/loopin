// 모바일 키보드(가상 키패드)가 열릴 때 실제 보이는 영역만큼만 앱이 차지하도록
// visualViewport 높이를 CSS 변수 --app-height 에 반영한다.
// - iOS Safari: dvh 가 키보드에 반응하지 않으므로 visualViewport 로 직접 계산
// - Android Chrome: interactive-widget=resizes-content 와 함께 동작
export function initViewportHeight() {
  const root = document.documentElement;
  const vv = window.visualViewport;

  const apply = () => {
    const height = vv ? vv.height : window.innerHeight;
    root.style.setProperty('--app-height', `${height}px`);
  };

  apply();

  if (vv) {
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
  } else {
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
  }
}
