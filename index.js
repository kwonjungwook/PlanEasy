// index.js - 명시적으로 App 컴포넌트를 진입점으로 지정
import { registerRootComponent } from "expo";
import App from "./App";

// 명시적으로 registerRootComponent 호출
registerRootComponent(App);

// 추가로 모듈로 내보내기
export default App;
