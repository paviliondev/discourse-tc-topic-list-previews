import {getOwner} from 'discourse-common/lib/get-owner';

export default {
  setupComponent (attrs, component) {

    const determineImages = (controller) => {

      var featuredTopics = controller.get ('featuredTopics')

      featuredTopics = featuredTopics ? featuredTopics.topic_list.topics : [];

      const showFeaturedImages = settings.topic_list_featured_images && controller.category == null ||
        settings.topic_list_featured_images_category && controller.category != null;

      if (controller.category && settings.topic_list_featured_images_from_current_category_only) {
        featuredTopics = featuredTopics.filter(topic => topic.category_id == controller.category.id)
      };

      const reducedFeaturedTopics = featuredTopics ? settings.topic_list_featured_images_count == 0 ? featuredTopics : featuredTopics.slice(0,settings.topic_list_featured_images_count) : [];

      if (settings.topic_list_featured_images_created_order) {
        reducedFeaturedTopics.sort((a, b) => {
          var keyA = new Date(a.created_at), keyB = new Date(b.created_at);
          // Compare the 2 dates
          if (keyA < keyB) return 1;
          if (keyA > keyB) return -1;
          return 0;
        });
      }

      component.set ('showFeaturedImages', showFeaturedImages);
      component.set ('featuredTopics', reducedFeaturedTopics);
    };

    const controller = getOwner (this).lookup ('controller:discovery');

    determineImages(controller);

    controller.addObserver ('featuredTopics', () => {

      if (this._state === 'destroying') return;

      determineImages(controller);
    });

    controller.addObserver ('category', () => {

      if (this._state === 'destroying') return;

      determineImages(controller);
    });
  },
};
