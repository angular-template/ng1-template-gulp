declare interface IUtils {
    createModule: (name: string, config?: IConfig) => IModule;
}

declare function require(name: string): (IUtils | any);
declare let module: {
    exports: (config: any) => void;
};

declare interface IConfig {
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
    preferences: {
        failOnVetError: boolean,
        vetBeforeDevBuild: boolean
    },
    /**
     * Collection of modules in the application.
     * The collection must be ordered in increasing levels of dependency on other application modules.
     * For example, the common module should be first in the collection as all other modules depend on it.
     */
    modules: IModule[];

    /**
     * List of 3rd-party modules that all modules depend on.
     */
    coreDependencies: string[];

    /**
     * Global style settings for the application.
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

        injections: string[];
        css: string[];
        less: string[];
        sass: string[];
    };

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
     * TSLint settings for different sets of Typescript files.
     */
    tslint: {
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
    }[];

    getStyleAssets: (cssFolder: string, cssParentFolder: string) => {
        src: string;
        dest: string;
        areImages?: boolean;
    }[];
}

declare interface IModule {
    name?: string;
    folder?: string;
    ns?: string;
    styles?: {
        less: string[];
        sass: string[];
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
