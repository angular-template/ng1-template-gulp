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
    styles?: {
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
}

declare interface IModule {
    name?: string;
    folder?: string;
    ns?: string;
    styles?: {
        less: string[];
        sass: string[];
    }[];
    jsToInject?: string[];
    firstInjectJs?: string[];
    htmls?: {
        all?: string;
        root?: string;
        taCache?: string;
    }
}
