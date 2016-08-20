import {DiffExtract} from "./util";

const A = { gozzila: { mode: 3 } };

const B = { gozzila: { mode: 3 } };

console.log(DiffExtract.diff(A, B));