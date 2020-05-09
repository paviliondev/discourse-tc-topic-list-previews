import { getOwner } from 'discourse-common/lib/get-owner';

export default {
  setupComponent(attrs, component) {
    component.set('showFeaturedImages', settings.topic_list_featured_images);
    const controller = getOwner(this).lookup('controller:discovery');

    component.set('featuredTopics', controller.get('featuredTopics'));

    controller.addObserver('featuredTopics', () => {
       if (this._state === 'destroying') return;
       const featuredTopics = controller.get('featuredTopics');
       component.set('featuredTopics', featuredTopics);
     });
  }
}
