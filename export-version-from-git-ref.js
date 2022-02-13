const {exec} = require("child_process");
const getImageAndVersionRegex = /(?<=refs\/tags\/v)(?<version>.*)/;

/**
 * Sets the following variables into "GITHUB_ENV" env variable:
 *
 * - VERSION: e.g. "0.0.1"
 * - VERSION_SHA: e.g. "0.0.1-534716e"
 * - VERSION_SHA_BUILD: VERSION + GITHUB_SHA + build system (GitHub actions "ga") + run id + run number e.g. "0.0.1-534716e-ga-953451460-1"
 *
 * You must tag your GitHub release using the format "v<semver>" e.g. "v1", "v1.1", "v1.1.1" or "v0.0.1-rc.0" (always
 * with a lowercase "v").
 *
 * This script is intended to be invoked from the GitHub actions runtime and expects the existence of the "GITHUB_REF"
 * env variable. If the execution of this script fails, an error message is printed and process exists with an error
 * code 1.
 *
 * https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#setting-an-environment-variable
 */
(function githubExportVersionFromRef() {
    // Contains something like 'refs/tags/v0.0.1-rc.0'
    const githubRef = process.env.GITHUB_REF;

    if (!githubRef) {
        console.error("Invalid GITHUB_REF", githubRef);
        process.exit(1);
    }

    const version = githubRef.match(getImageAndVersionRegex)?.groups?.version;

    if (!version) {
        console.error("Cannot get the version from GITHUB_REF", {githubRef});
        console.error("Tag your release like \"v1.2.3\" or \"v1.2.3-rc.0\". Use a \"v\" before the version number.");
        process.exit(1);
    }

    exec(`echo VERSION="${version}" >> $GITHUB_ENV`);
    exec(`echo VERSION_SHA="${version}-$(echo $GITHUB_SHA | head -c7)" >> $GITHUB_ENV`);
    exec(`echo VERSION_SHA_BUILD="${version}-$(echo $GITHUB_SHA | head -c7)-ga-\${GITHUB_RUN_ID}" >> $GITHUB_ENV`);
})();
