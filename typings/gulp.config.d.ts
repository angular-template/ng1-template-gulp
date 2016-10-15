/**
 * Functions from the utils module
 */
declare interface IUtils {
    createModule: (name: string, peerDependencies: string[], config?: IModule) => IModule;
    log: (message: string | Object, color: any) => void;
    exclude: (glob: string | string[]) => (string | string[]);
}

declare interface IConfig {
    /**
     * Environment-specific configuration settings.
     */
    config: {
        /**
         * Environment to use to generate the config script file if one is not specified.
         */
        defaultEnv: string;

        /**
         * List of additional environments to create config scripts for during a dist build.
         * These additional config files will be named 'config.<env>.js'.
         * Useful for when we want to redeploy the app without having to run the Gulp tasks each time.
         */
        generateEnvs: string[];
    },

    /**
     * List of 3rd-party modules that all modules depend on.
     */
    coreDependencies: string[];

    /**
     * Well-known folders in the template.
     * DO NOT CHANGE.
     */
    folders: {
        root: string;
        bower: string;
        build: string;
        client: string;
        nodeModules: string;
        server: string;
        tools: string;
        typings: string;
        webserver: string;
        assets: string;
        modules: string;
        devBuild: string;
        devBuildScripts: string;
        devBuildStyles: string;
        distBuild: string;
    },

    /**
     * Collection of modules in the application.
     * The collection must be ordered in increasing levels of dependency on other application modules.
     * For example, the common module should be first in the collection as all other modules depend on it.
     */
    modules: IModule[];

    /**
     * Options for various NPM plugins.
     */
    options: {
        typescriptBuild: any;
        typescriptVet: any;
        htmlMin: any;
        autoPrefixer: any;
    },

    /**
     * Preferences that control how the Gulp processes behave.
     */
    preferences: {
        /**
         * Throws an exception to fail the Gulp process if any of the vet tasks fails.
         * This is useful in continuous integrations systems to indicate an error in the build
         * process and allows the CI process to be stopped.
         * It is typically not required in the development environment, when running from the
         * command line.
         */
        failOnVetError: boolean,

        /**
         * Run the vet tasks before every build. This is useful to continuously check your code
         * correctness and catch issues fast.
         * Note that the vet tasks are not executed in watch mode (whenever a change is detected);
         * they are only run the gulp build or gulp serve task from the command line.
         */
        vetBeforeDevBuild: boolean,

        /**
         * Indicates whether the application should be launched for Gulp serve tasks (serve and
         * serve-dist).
         * You can also specify a string value that indicates the initial URL path to launch the
         * browser with.
         * For example, if you specify a value of '/customers/list', the browser will be launched
         * at the URL <base-url>/customers/list.
         * You can control this behavior from the command line by using the --launch option.
         */
        launchBrowserOnServe: boolean | string,

        lineEndings: 'LF'|'CR'|'CRLF';

        /**
         * Indicates whether to add static file configuration to copy images in module folders to
         * the output folder.
         * Default is true.
         */
        addModuleImagesToStaticFiles: boolean;
    },

    scripts: {
        /**
         * Whether to emit source maps for the generated JavaScript files.
         * This is enabled by default, and the source maps are embedded into the JavaScript files,
         * so no additional .js.map files are created.
         */
        sourceMaps: boolean;
    };

    /**
     * Static files and assets in the application.
     */
    staticFiles: {
        images: {[name: string]: (rootFolder: string, cssFolder: string) => {
            src: string | string[];
            dest: string;
        }};

        fonts: {[name: string]: (rootFolder: string, cssFolder: string) => {
            src: string | string[];
            dest: string;
        }};

        files: {[name: string]: (rootFolder: string) => {
            src: string | string[];
            dest: string;
        }};
    };

    /**
     * Global style settings for the application.
     * For module-specific style settings, refer to the config.modules structure.
     */
    styles: {
        /**
         * Set to true if you use LESS in the application.
         */
        usesLess: boolean;

        /**
         * Set to true if you use SASS in the application.
         */
        usesSass: boolean;

        /**
         * Set to true to add vendor prefixes to generated CSS styles
         */
        autoPrefix: boolean;

        /**
         * Array of .css files to inject into the index.html. Order is important here because the
         * files are injected in the order they appear in the array.
         */
        injections: string[];

        css: string[];

        less: string[];

        sass: string[];
    };

    /**
     * TSLint settings for different sets of Typescript files.
     */
    tslint: {[name: string]: ITsLintRule}
}

declare interface IModule {
    /**
     * Name of the module.
     */
    name?: string;

    /**
     * Name of the folder where the module code resides. This is the subfolder under client/modules.
     */
    folder?: string;
    ns?: string;

    /**
     * Additional module dependencies specific to only this module.
     */
    dependencies?: string[];
    styles?: {
        less?: string[];
        sass?: string[];
    }[];
    jsOutputFolder?: string;
    jsToInject?: string[];
    firstInjectJs?: string[];
    htmls?: {
        all?: string;
        root?: string;
        taCache?: string;
    }
}

declare interface ITsLintRule {
    /**
     * Descriptive name for the rules, to be displayed in the Gulp output.
     */
    description: string;

    /**
     * Path to the TSLint config file. The file name does not need to be tslint.json.
     */
    config: string;

    /**
     * One or more file globs that specify the Typescript files to lint under this ruleset.
     */
    files: string[];

    /**
     * One or more file globs that specify the files to exclude from the linting.
     */
    exclude: string[];
}
