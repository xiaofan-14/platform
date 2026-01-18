import { Suspense } from "react";
import Datalist from "./Datalist";

export default function Page() {
    return (
        <Suspense>
            <Datalist />
        </Suspense>
    )
}