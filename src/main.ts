import { SubstitutionSolver } from './substitutionSolver';

async function main() {
    const substitutionSolver = new SubstitutionSolver();
    await substitutionSolver.start();
}

main();