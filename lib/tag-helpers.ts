import { createClientWithAsyncCookies } from '@/lib/supabase';

interface Tag {
  id: number;
  name: string;
  category?: string;
}

/**
 * Helper function to save tags to a junction table
 * This is a root cause fix for tag insertion failures across all modules
 * 
 * @param supabase - Supabase client
 * @param entityId - The ID of the entity (job_id or user_id)
 * @param tagIds - Array of tag IDs to associate with the entity
 * @param junctionTable - The junction table name ('job_tags' or 'user_tags')
 * @param entityField - The field name for the entity ID ('job_id' or 'user_id')
 * @returns Object with success status or error
 */
export async function saveTags(
  supabase: any,
  entityId: string,
  tagIds: number[],
  junctionTable: 'job_tags' | 'user_tags',
  entityField: 'job_id' | 'user_id'
) {
  try {
    console.log(`[saveTags] Starting tag save for ${entityField}=${entityId} to ${junctionTable}`);
    console.log(`[saveTags] Raw tag IDs:`, tagIds);

    // Validate input
    if (!entityId) {
      console.error('[saveTags] Error: entityId is required');
      return { error: 'Entity ID is required' };
    }

    if (!tagIds || !Array.isArray(tagIds)) {
      console.error('[saveTags] Error: tagIds must be an array');
      return { error: 'Tag IDs must be an array' };
    }

    // Convert to integers and filter out invalid values
    const parsedTagIds = tagIds
      .map(tagId => {
        if (typeof tagId === 'string') {
          const parsed = parseInt(tagId, 10);
          return isNaN(parsed) ? null : parsed;
        } else if (typeof tagId === 'number') {
          return tagId;
        }
        return null;
      })
      .filter((tagId): tagId is number => tagId !== null);

    console.log(`[saveTags] Parsed tag IDs:`, parsedTagIds);

    if (parsedTagIds.length === 0) {
      console.log('[saveTags] No valid tag IDs provided');
      return { success: true, message: 'No tags to save' };
    }

    // Remove duplicates
    const uniqueTagIds = Array.from(new Set(parsedTagIds));
    console.log(`[saveTags] Unique tag IDs:`, uniqueTagIds);

    // Verify that all tag IDs exist in the tags table
    const { data: existingTags, error: tagsCheckError } = await supabase
      .from('tags')
      .select('id')
      .in('id', uniqueTagIds);

    if (tagsCheckError) {
      console.error('[saveTags] Failed to check tags:', tagsCheckError);
      console.error('[saveTags] Error details:', {
        code: tagsCheckError.code,
        message: tagsCheckError.message,
        details: tagsCheckError.details,
        hint: tagsCheckError.hint
      });
      return { error: 'Failed to validate tags' };
    }

    const existingTagIds = existingTags?.map((tag: Tag) => tag.id) || [];
    console.log(`[saveTags] Existing tag IDs in database:`, existingTagIds);

    const invalidTagIds = uniqueTagIds.filter(tagId => !existingTagIds.includes(tagId));
    
    if (invalidTagIds.length > 0) {
      console.error('[saveTags] Invalid tag IDs:', invalidTagIds);
      console.error('[saveTags] These tag IDs do not exist in the tags table');
      return { error: `Invalid tag IDs: ${invalidTagIds.join(', ')}` };
    }

    // Prepare insert data
    const tagInserts = uniqueTagIds.map((tagId) => ({
      [entityField]: entityId,
      tag_id: tagId,
    }));

    console.log(`[saveTags] Preparing to insert ${tagInserts.length} tag associations:`, tagInserts);

    // Use upsert with onConflict to handle duplicates gracefully
    // The junction tables have PRIMARY KEY (entity_id, tag_id) constraints
    const { data: insertedTags, error: tagsError } = await supabase
      .from(junctionTable)
      .upsert(tagInserts, {
        onConflict: `${entityField},tag_id`
      })
      .select();

    if (tagsError) {
      console.error('[saveTags] Failed to save tags:', tagsError);
      console.error('[saveTags] Error details:', {
        code: tagsError.code,
        message: tagsError.message,
        details: tagsError.details,
        hint: tagsError.hint
      });
      
      // Try alternative approach: delete existing and insert new
      console.log('[saveTags] Trying alternative approach: delete existing and insert new');
      
      // Delete existing tags for this entity
      const { error: deleteError } = await supabase
        .from(junctionTable)
        .delete()
        .eq(entityField, entityId);

      if (deleteError) {
        console.error('[saveTags] Failed to delete existing tags:', deleteError);
        return { error: 'Failed to update tags (delete failed)' };
      }

      // Insert new tags
      const { error: insertError } = await supabase
        .from(junctionTable)
        .insert(tagInserts);

      if (insertError) {
        console.error('[saveTags] Failed to insert tags after delete:', insertError);
        return { error: 'Failed to update tags (insert failed)' };
      }

      console.log('[saveTags] Successfully saved tags using delete+insert approach');
      return { success: true, message: 'Tags saved successfully' };
    }

    console.log(`[saveTags] Successfully saved ${insertedTags?.length || 0} tag associations`);
    return { success: true, data: insertedTags };
  } catch (error) {
    console.error('[saveTags] Unexpected error:', error);
    return { error: 'Internal server error while saving tags' };
  }
}

/**
 * Helper function to delete all tags for an entity
 * Useful when switching roles or clearing tags
 */
export async function deleteEntityTags(
  supabase: any,
  entityId: string,
  junctionTable: 'job_tags' | 'user_tags',
  entityField: 'job_id' | 'user_id'
) {
  try {
    console.log(`[deleteEntityTags] Deleting tags for ${entityField}=${entityId} from ${junctionTable}`);
    
    const { error: deleteError } = await supabase
      .from(junctionTable)
      .delete()
      .eq(entityField, entityId);

    if (deleteError) {
      console.error('[deleteEntityTags] Failed to delete tags:', deleteError);
      return { error: 'Failed to delete tags' };
    }

    console.log(`[deleteEntityTags] Successfully deleted tags for ${entityField}=${entityId}`);
    return { success: true };
  } catch (error) {
    console.error('[deleteEntityTags] Unexpected error:', error);
    return { error: 'Internal server error while deleting tags' };
  }
}

/**
 * Helper function to validate tag IDs
 */
export async function validateTagIds(supabase: any, tagIds: number[]) {
  try {
    if (!tagIds || tagIds.length === 0) {
      return { success: true, validTagIds: [] };
    }

    const { data: existingTags, error: tagsCheckError } = await supabase
      .from('tags')
      .select('id')
      .in('id', tagIds);

    if (tagsCheckError) {
      console.error('[validateTagIds] Failed to check tags:', tagsCheckError);
      return { error: 'Failed to validate tags' };
    }

    const existingTagIds = existingTags?.map((tag: Tag) => tag.id) || [];
    const invalidTagIds = tagIds.filter(tagId => !existingTagIds.includes(tagId));

    if (invalidTagIds.length > 0) {
      console.error('[validateTagIds] Invalid tag IDs:', invalidTagIds);
      return { error: `Invalid tag IDs: ${invalidTagIds.join(', ')}`, invalidTagIds };
    }

    return { success: true, validTagIds: tagIds };
  } catch (error) {
    console.error('[validateTagIds] Unexpected error:', error);
    return { error: 'Internal server error while validating tags' };
  }
}