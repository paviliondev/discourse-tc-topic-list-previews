import {getOwner} from 'discourse-common/lib/get-owner';

export default {
  setupComponent (attrs, component) {

    const showFeaturedImages = settings.topic_list_featured_images && attrs.category == null ||
        settings.topic_list_featured_images_category && attrs.category != null;

    component.set (
      'showFeaturedImages',
      showFeaturedImages
    );
    const controller = getOwner (this).lookup ('controller:discovery');
    const featuredTopics = controller.get ('featuredTopics');
    let reducedFeaturedTopics = featuredTopics ?  featuredTopics.topic_list.topics.slice(0,settings.topic_list_featured_images_count) : [];

    component.set ('featuredTopics', reducedFeaturedTopics);

    controller.addObserver ('featuredTopics', () => {
      if (this._state === 'destroying') return;

      const featuredTopics = controller.get ('featuredTopics');
      const reducedFeaturedTopics = featuredTopics ?  featuredTopics.topic_list.topics.slice(0,settings.topic_list_featured_images_count) : [];

      component.set ('featuredTopics', reducedFeaturedTopics);
    });

    controller.addObserver ('category', () => {
      if (this._state === 'destroying') return;

      const showFeaturedImages = settings.topic_list_featured_images && controller.get ('category') == null ||
        settings.topic_list_featured_images_category && controller.get ('category') != null;

      component.set ('showFeaturedImages', showFeaturedImages);
    });
  },
};
