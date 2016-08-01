declare interface IUtils {
    createModule: (name: string, config?: IConfig) => IModule;
}

declare function require(name: string): (IUtils | any);
declare let module: {
    exports: (config: any) => void;
};

declare interface IConfig {
    /**
     * Well-known folders.
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
    modules: IModule[];
    coreDependencies: string[];
    styles?: {
        usesLess: boolean;
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
