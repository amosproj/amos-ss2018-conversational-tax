namespace DBConfig {

    /**
     * The main database provider
     * @name DBConfig#DB_PROVIDER
     * @type {string}
     */
    export const DB_PROVIDER: string = 'DbConnectionToken';

    /**
     * The main provider of the user model (= name of the user "table")
     * @name DBConfig#USER_MODEL_PROVIDER
     * @type {string}
     */
    export const USER_MODEL_PROVIDER: string = 'Users';

    /**
     * The main provider of the employmentContract model
     * (= name of the employmentContract "table")
     * @name DBConfig#EMPLOYMENTCONTRACT_MODEL_PROVIDER
     * @type {string}
     */
    export const EMPLOYMENTCONTRACT_MODEL_PROVIDER: string = 'EmploymentContract';

}

export default DBConfig;