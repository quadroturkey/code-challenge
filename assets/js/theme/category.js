/* eslint-disable no-alert */
/* eslint-disable no-plusplus */
/* eslint-disable no-undef */
/* eslint-disable func-names */
/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';

export default class Category extends CatalogPage {
  constructor(context) {
    super(context);
    this.validationDictionary = createTranslationDictionary(context);
  }

  setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
    $element.attr({
      role: roleType,
      'aria-live': ariaLiveStatus,
    });
  }

  makeShopByPriceFilterAccessible() {
    if (!$('[data-shop-by-price]').length) return;

    if ($('.navList-action').hasClass('is-active')) {
      $('a.navList-action.is-active').focus();
    }

    $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
  }

  onReady() {
    this.arrangeFocusOnSortBy();
    this.changeImgOnHover();

    const url = '/api/storefront/carts';
    setTimeout(() => {
      this.getCart(url);
    }, 300);

    $('#addToCart').on('click', () => {
      $.get('/cart.php?action=add&product_id=112');
      alert('Item Added to Cart');
      setTimeout(() => {
        this.getCart(url);
      }, 300);
    });

    $('#removeAllItems').on('click', () => {
      this.getCartIdForRemoval(url);
    });


    $('[data-button-type="add-cart"]').on('click', e => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

    this.makeShopByPriceFilterAccessible();

    compareProducts(this.context);

    if ($('#facetedSearch').length > 0) {
      this.initFacetedSearch();
    } else {
      this.onSortBySubmit = this.onSortBySubmit.bind(this);
      hooks.on('sortBy-submitted', this.onSortBySubmit);
    }

    $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

    this.ariaNotifyNoProducts();
  }

  ariaNotifyNoProducts() {
    const $noProductsMessage = $('[data-no-products-notification]');
    if ($noProductsMessage.length) {
      $noProductsMessage.focus();
    }
  }

  initFacetedSearch() {
    const {
      price_min_evaluation: onMinPriceError,
      price_max_evaluation: onMaxPriceError,
      price_min_not_entered: minPriceNotEntered,
      price_max_not_entered: maxPriceNotEntered,
      price_invalid_value: onInvalidPrice,
    } = this.validationDictionary;
    const $productListingContainer = $('#product-listing-container');
    const $facetedSearchContainer = $('#faceted-search-container');
    const productsPerPage = this.context.categoryProductsPerPage;
    const requestOptions = {
      config: {
        category: {
          shop_by_price: true,
          products: {
            limit: productsPerPage,
          },
        },
      },
      template: {
        productListing: 'category/product-listing',
        sidebar: 'category/sidebar',
      },
      showMore: 'category/show-more',
    };

    this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
      $productListingContainer.html(content.productListing);
      $facetedSearchContainer.html(content.sidebar);

      $('body').triggerHandler('compareReset');

      $('html, body').animate({
        scrollTop: 0,
      }, 100);
    }, {
      validationErrorMessages: {
        onMinPriceError,
        onMaxPriceError,
        minPriceNotEntered,
        maxPriceNotEntered,
        onInvalidPrice,
      },
    });
  }

  changeImgOnHover() {
    const cardFigures = document.getElementsByClassName('card-figure');
    for (let i = 0; i < cardFigures.length; i++) {
      cardFigures[i].addEventListener('mouseover', function () {
        const img = this.getElementsByClassName('card-image')[0];
        let newImg = img.dataset.hoverimage;
        newImg = newImg.replace('{:size}', '1000x1000');
        img.src = newImg;
        this.addEventListener('mouseout', () => {
          img.src = img.dataset.src;
        });
      });
    }
  }

  checkCart(cart) {
    if (cart.length > 0) {
      $('#removeAllItems').css('display', 'block');
    }
  }

  removeCart(cart) {
    const cartId = cart[0].id;
    fetch(`https://special-store2.mybigcommerce.com/api/storefront/carts/${cartId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => response.json())
      .then(alert('Cart has been emptied'))
      .catch(error => console.log(error));
  }

  getCartIdForRemoval(url) {
    console.log('cart id for removal');
    fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
    })
      .then(response => response.json())
      .then(response => this.removeCart(response, url));
  }

  getCart(url) {
    fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
    })
      .then(response => response.json())
      .then(response => this.checkCart(response));
  }
}
