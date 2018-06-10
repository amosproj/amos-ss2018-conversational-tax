import { Document } from 'mongoose';

/**
 * This implements the Notification interface used by NotificationService
 * @interface Notification
 */
export interface Notification extends Document {

    /**
     * The unique id of the Notification
     * @name Notification#_id
     * @type {string}
     */
    readonly _id: string;

    /**
     * The id of the user
     * @name Notification#user_id
     * @type {string}
     */
    readonly user_id: string;

    /**
     * The title of the notification
     * @name Notification#description
     * @type {string}
     */
    readonly title: string;

    /**
     * The description of the notification
     * @name Notification#description
     * @type {string}
     */
    readonly description: string;

}