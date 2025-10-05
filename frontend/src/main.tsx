/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

// const elem = document.getElementById("root")!;
// const app = (
//   <StrictMode>
//     <AppProvider>
//       <RouterProvider router={router} />
//     </AppProvider>
//   </StrictMode>
// );
// if (import.meta.hot) {
//   // With hot module reloading, `import.meta.hot.data` is persisted.
//   const root = (import.meta.hot.data.root ??= createRoot(elem));
//   root.render(app);
// } else {
//   // The hot module reloading API is not available in production.
//   createRoot(elem).render(app);
// }
import ReactDOM from "react-dom/client";
import {StrictMode} from "react";
import {router} from "@/app/router";
import AppProvider from "@/app/provider";
import {RouterProvider} from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppProvider>
            <RouterProvider router={router}/>
        </AppProvider>
    </StrictMode>
);
