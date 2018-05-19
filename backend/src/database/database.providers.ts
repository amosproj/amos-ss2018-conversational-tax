import * as mongoose from 'mongoose';
import Config from '../../config/config';
import DBConfig from './dbconfig';

export const databaseProviders = [
    {
        provide: DBConfig.DB_PROVIDER,
        useFactory: async () => {
            (mongoose as any).Promise = global.Promise;
            return await mongoose.connect(Config.MONGO_URL);
        },
    },
];