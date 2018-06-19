import { NavigationActions, DrawerActions } from 'react-navigation';

interface NavigationRoute {
    key: string,
    params: any,
    routeName: string,
}

/**
 * Singleton NavigationService
 */
class NavigationServiceInstance {
    private static _instance: NavigationServiceInstance;
    private _navigator: any;
    private routeStack: string[] = [];

    /**
     * Initlizes this service
     * @param navigatorRef the Ref to the root navigator
     */
    public setTopLevelNavigator(navigatorRef: any): void {
        this._navigator = navigatorRef;
    }

    /**
     * Navigates to another route
     * @param routeName name as specified in App.tsx
     * @param params optional params
     */
    public navigate(routeName: string, params?: any): void {
        this.routeStack.push(routeName);
        this._navigator.dispatch(
            NavigationActions.navigate({
                routeName,
                params,
            })
        );
    }

    /**
     * Go back one step
     */
    public goBack(): void {
        this.routeStack.pop();
        const routeName = this.routeStack.pop();
        if (routeName !== undefined) {
            this.navigate(routeName);
        }
    }

    /**
     * Returns the active route
     * @returns {string} routeName
     */
    public activeRoute(): string {
        const lastIndex = this.routeStack.length - 1;
        if (lastIndex < 0) {
            return '';
        }
        return this.routeStack[lastIndex];
    }

    /**
     * Opens the drawer Navigation
     */
    public openDrawer(): void {
        this._navigator.dispatch(
            DrawerActions.openDrawer()
        );  
    }

    /**
     * Get a parameter of the current route
     * @param key The key for the parameter
     * @returns {any | undefined} Returns undefined on a error or the element on success.
     */
    public getParam(key: string): any | undefined {
        const route = this.getCurrRouteObj();
        if (route.params === undefined) {
            return undefined;
        }
        const value = route.params[key];
        if (value === undefined) {
            return undefined;
        }  
        return value;
    }

    /**
     * Extracts the route object from the frameworks state object.
     * @returns {NavigationRoute} The active route object
     */
    private getCurrRouteObj(): NavigationRoute {
        const routes: NavigationRoute[] = this._navigator.state.nav.routes;
        const currRouteName = this.activeRoute();
        return routes.find((route) => 
            route.routeName === currRouteName
        )!;
    }

    /**
     * Returns the singletons instance.
     * @returns {NavigationServiceInstance} The NavigationServiceInstance instance
     */
    public static get Instance(): NavigationServiceInstance {
        return this._instance || (this._instance = new this());
    }
}

export const NavigationService = NavigationServiceInstance.Instance
