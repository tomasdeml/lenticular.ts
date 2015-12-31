import * as b from 'bobril';
import { page as mainPage } from './page';

b.routes(
    b.route({ handler: mainPage })
);
