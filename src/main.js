import { mountWidget } from './tecnam-p2006t-widget.js';

const root = document.getElementById('app');
if (!root) throw new Error('#app mount point missing');
mountWidget(root);
