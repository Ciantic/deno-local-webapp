/* @refresh reload */
import "./ui/index.css";
import { render } from "solid-js/web";
import App from "./ui/App.tsx";

render(() => <App />, document.getElementById("root") as HTMLElement);
