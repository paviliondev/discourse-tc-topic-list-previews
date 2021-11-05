import DiscourseUrl from 'discourse/lib/url';
import discourseComputed from "discourse-common/utils/decorators";
import { testImageUrl, getDefaultThumbnail } from '../lib/tlp-utilities';

export default Ember.Component.extend({
  tagName: 'a',
  attributeBindings: ['href'],
  classNameBindings: [':tlp-featured-topic', "showDetails", 'featuredTag'],

  didInsertElement() {
    const topic = this.get('topic');

    if (topic) {
      const defaultThumbnail = getDefaultThumbnail();

      testImageUrl(topic.thumbnails, this.get("currentUser"), (imageLoaded) => {
        if (!imageLoaded) {
          Ember.run.scheduleOnce('afterRender', this, () => {
            if (defaultThumbnail) {
              if (this._state === 'destroying') return;
              const $thumbnail = this.element('img.thumbnail');
              if ($thumbnail) {
                $thumbnail.attr('src', defaultThumbnail);
              }
            } else {
              if (this._state === 'destroying') return;
              this.element.style.display = 'none';
            }
          });
        }
      });
    }
  },

  @discourseComputed
  featuredUser() {
    return this.get('topic').posters[0].user;
  },

  @discourseComputed
  featuredUsername() {
    return this.get('topic').posters[0].user.username;
  },

  @discourseComputed
  featuredExcerpt() {
    return (settings.topic_list_featured_excerpt > 0 && this.get('topic').excerpt) ? this.get('topic').excerpt.slice(0,settings.topic_list_featured_excerpt) : false;
  },

  @discourseComputed
  featuredTags() {
    return settings.topic_list_featured_images_tag.split('|');
  },

  @discourseComputed('topic.tags')
  featuredTag(tags) {
    return tags.filter(tag => this.get('featuredTags').indexOf(tag) > -1)[0];
  },

  mouseEnter() {
    this.set('showDetails', true);
  },

  mouseLeave() {
    this.set('showDetails', false);
  },

  @discourseComputed('topic.id')
  href(topicId) {
    return `/t/${topicId}`;
  },

  click(e) {
    e.preventDefault();
    DiscourseUrl.routeTo(this.get('href'));
  }
});
