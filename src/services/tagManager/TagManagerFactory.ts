import { TagManager, TagFormat, TagLocation } from './TagManager';
import { FrontmatterTagManager } from './FrontmatterTagManager';
import { InlineTagManager } from './InlineTagManager';

export class TagManagerFactory {
	static create(format: TagFormat, tagLocation?: TagLocation): TagManager {
		if (format === 'property') {
			return new FrontmatterTagManager();
		}
		return new InlineTagManager(tagLocation);
	}
}
