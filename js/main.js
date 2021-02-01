// 'use strict'

const API = 'https://raw.githubusercontent.com/GeekBrainsTutorial/online-store-api/master/responses';

/**
 * Класс списка товаров
 */
class List {
    constructor(url, container, list = list2) {
        this.container = container;
        this.list = list;
        this.url=url;
        this.goods = []; //массив товаров
        this.allProducts=[]; //массив объектов
        this.filtered = [];
        this._init();
    }

    getJson(url){
        return fetch(url ? url : `${API + this.url}`)
            .then(result => result.json())
            .catch(error => {
                console.log(error);
            })
    }

    handleData(data){
        this.goods = [...data];
        this.render();
    }

    calcSum(){
        return this.allProducts.reduce((accum, item) => accum += item.price, 0);
    }

    render(){
        const block = document.querySelector(this.container);
        for(let product of this.goods){
            // const productObject = new ProductItem(product);
            // {ProductsList: ProductItem,
            //     Cart: CartItem}
             const productObject = new this.list[this.constructor.name](product); // создаем мовый объект класса ProductItem или класса CartItem
            this.allProducts.push(productObject);
            block.insertAdjacentHTML('beforeend', productObject.render());
        }
    }

    // фильтрация товаров по строке
    filter(value){
        const regexp = new RegExp(value, 'i');
        this.filtered = this.allProducts.filter(product => regexp.test(product.product_name));
        this.allProducts.forEach(el => {
            const block = document.querySelector(`.product-item[data-id="${el.id_product}"]`);
            if(!this.filtered.includes(el)){
                block.classList.add('invisible');
            } else {
                block.classList.remove('invisible');
            }
        })
    }

    /**
     * Заглушка в родителе
     */
    _init(){
        return false;
    }

}

/**
 * Общий класс товара
 */
class Item {

     // constructor(el, img='https://placehold.it/50x150'){
    constructor(el, img = 'img/product.jpg') {
        this.product_name = el.product_name;
        this.price = el.price;
        this.id_product = el.id_product;
        this.img = img;
    }

    // генерация карточки товара
    render(){
    // <button class="buy-btn"
    //     data-id="${this.id_product}"
    //     data-name="${this.product_name}"
    //     data-price="${this.price}">Купить</button>

    //    <img class="cart-image" src="${this.img}" alt="image">
        return `<div class="product-item" data-id="${this.id_product}">
                <div class=""><img src="${this.img}" alt="image"></div>
                <h3>${this.product_name}</h3>
                <p>${this.price}</p>
                
                <input type="button" value="Купить" class="buy-btn"
                data-id="${this.id_product}"
                data-name="${this.product_name}" 
                data-price="${this.price}">
            </div>`
    }
}

/**
 * Список товаров каталога
 */
class ProductsList extends List{
    // constructor(container = '.products'){
    constructor(cart, container = '.products', url =  '/catalogData.json'){
        super(url, container); // в конце вызывается _init()
        this.cart = cart;
        this.getJson()
            .then(data => this.handleData(data)); // handleData запускает отрисовку каталога товаров или
    }
    _init(){
        document.querySelector(this.container).addEventListener('click', e =>{
            if (e.target.classList.contains('buy-btn')){
                // e.target — источник события, кнопка
                this.cart.addProduct(e.target);
            }
        });

        document.querySelector('.search-form').addEventListener('submit', e => {
            // отменить действие браузера по умолчанию
            e.preventDefault();
            this.filter(document.querySelector('.search-field').value)
        })
    }

    // итоговая сумма всех товаров на странице
    totalPrice(){
        let price = 0;

        for(let product of this.goods){
            price += product.price;
        }
        console.log(price);
        return price;
    }
}

/**
 * Товар каталога
 */
class ProductItem extends Item{ }

/**
 * Список товаров корзины
 */
class Cart extends List{
    constructor(container = '.cart', url = '/getBasket.json'){
        super(url, container);
        // this.catrItems = []; //массив товаров в корзине
        this.amount = 0; // сумма заказа
        this.countGoods = 0; // количество товаров в корзине
        this.getJson()
            .then(data => {
                this.handleData(data.contents);
            })
    }

    _getCartItems(){
        return fetch(`${API}/getBasket.json`)
            .then(result => result.json())
            .catch(error => {
                console.log(error);
            })

    }


    // генерация корзины
    _render(){
        const block = document.querySelector(this.container);
        for(let item of this.catrItems){
            const productObject = new CartItem(item);
//            this.allProducts.push(productObject);
            block.insertAdjacentHTML('beforeend', productObject.render());
        }
        block.insertAdjacentHTML('beforeend', this._renderAmount());
    }

    _renderAmount(){
        return `
            <div class="products-price">
                <p > Кол-во наименований: ${this.countGoods}</p>
                 <p > Итого: ${this.amount}</p>
            </div>
            `;
    }

    _init() {
        // возможно заменить на btn-cart-btn
        document.querySelector('.btn-cart-btn').addEventListener('click', e => {
            document.querySelector(this.container).classList.toggle('invisible');
        });

        document.querySelector(this.container).addEventListener('click', e => {
            if (e.target.classList.contains('del-btn')){
                // e.target — источник события, кнопка
                this.removeProduct(e.target);
            }
        });
    }

    // увеличить количество товаров на 1
    addProduct(element){
        this.getJson(`${API}/addToBasket.json`) // проверка связи с  JSON документом
            .then(data => {
                if(data.result === 1){
                    let productId = +element.dataset['id'];
                    let find = this.allProducts.find(product => product.id_product === productId);
                    if(find){
                        find.quantity++;
                        this._updateCart(find);
                    } else {
                        let product = {
                            id_product: productId,
                            price: +element.dataset['price'],
                            product_name: element.dataset['name'],
                            quantity: 1
                        };
                        this.goods = [product];
                        this.render();
                    }
                } else {
                    alert('Error');
                }
            })
    }

    // уменьшить количество товаров на 1
    removeProduct(element){
        this.getJson(`${API}/deleteFromBasket.json`)
            .then(data => {
                if(data.result === 1){
                    let productId = +element.dataset['id'];
                    let find = this.allProducts.find(product => product.id_product === productId);
                    if(find.quantity > 1){
                        find.quantity--;
                        this._updateCart(find);
                    } else {
                        this.allProducts.splice(this.allProducts.indexOf(find), 1);
                        document.querySelector(`.cart-item[data-id="${productId}"]`).remove();
                    }
                } else {
                    alert('Error');
                }
            })
    }

    // обновление корзины
    _updateCart(product){
        let block = document.querySelector(`.cart-item[data-id="${product.id_product}"]`);
        block.querySelector('.product-number').textContent = `Количество: ${product.quantity}`;
        block.querySelector('.product-cost').textContent = `Стоимость: ${product.quantity*product.price}`;
    }
}

/**
 *  Класс генерации одного элемента корзины
 */
class CartItem extends Item{
    constructor(el, img='https://placehold.it/50x100'){
        super(el, img);
        this.quantity = el.quantity;
    }

    // генерация одного товара в корзине
    render() {
        return `
        <div class="cart-item" data-id="${this.id_product}">
                <div class="left-block">
                    <img class="cart-image" src="${this.img}" alt="image">
                    <div class="product-list">
                        <p class="product-name">Наименование: ${this.product_name}</p>
                        <p class="product-price">Цена: ${this.price}</p>
                        <p class="product-number">Количество: ${this.quantity}</p>
                    </div>
                </div>
                <div class="right-block">     
                    <p class="product-cost">Стоимость: ${this.price*this.quantity}</p>      
                    <button class="del-btn" data-id="${this.id_product}">&times;</button>
                </div>
            </div>`;
    }
}

const list2 = {
    ProductsList: ProductItem,
    Cart: CartItem,
}

let cart = new Cart();
let list = new ProductsList(cart);
// Если мы хотим использовать в классе методы другого класса,
// то удобнее всего  в конструктор класса передать объект класса,
// методы которого нам нужны в даном классе
// products.getJson('getProducts.json').then(data => products.handleData(data));