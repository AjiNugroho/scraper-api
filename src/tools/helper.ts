import { InstagramPost_gd_lk5ns7kz21pck8jpis } from "../../types/intagram_posts_gd_lk5ns7kz21pck8jpis";
type comment_type ={
    comments:string;
    user_commenting:string;
    likes:number;
}
type lastest_comment_type ={
    comments:string;
    user_commenting:string;
    likes:number;
    replies:comment_type[]|null;
    profile_picture:string|null;
}
type tagged_user = {
    full_name:string|null;
    id:string|null;
    is_verified:boolean|null;
    profile_pic_url:string|null;
    username:string|null;
}

type content ={
    index:number|null;
    type:string|null;
    url:string|null;
    id:string|null;
    alt_text:string|null;
}

type video_duration ={
    url:string|null;
    duration:number|null;
}

type image = {
    url:string|null;
    id:string|null;
}

// videos duration belum

type ConvertedPostOutputType ={
    url: string;
    user_posted:string|null;
    description:string|null;
    hashtags:string[]|null;
    num_comments:number;
    shared:number;
    saved:number;
    likes:number;
    date_posted:string;
    photos:string[]|null;
    videos:string[]|null;
    latest_comments:lastest_comment_type[]|null;
    post_id:string|null;
    shortcode:string|null;
    content_type:string|null;
    pk:string|null;
    content_id:string|null;
    engagement_score_view:number
    thumbnail:string|null;
    video_view_count:number;
    video_play_count:number;
    product_type:string|null;
    tagged_users:tagged_user[]|null;
    followers:number;
    posts_count:number;
    profile_image_link:string|null;
    is_verified:boolean|null;
    is_paid_partnership:boolean|null;
    partnership_details:{
        profile_id:string|null,
        username:string|null,
        profile_url:string|null
    }|null;
    user_posted_id:string|null;
    post_content:content[]|null;
    audio:{
        audio_asset_id:string|null
        original_audio_title:string|null
        username:string|null
        artist_id:string|null
    }|null

    profile_url:string|null;
    videos_duration:video_duration[]|null;
    images:image[]|null;
    alt_text:string|null;
    photos_number:number|null;
    audio_url:string|null;
    timestamp:string;
    input:{
        url:string
    }
}

export const typeConverter = (initial:InstagramPost_gd_lk5ns7kz21pck8jpis) =>{
    // latest comment

    const processed_lastest_comments:lastest_comment_type[]|null = initial.latest_comments?initial.latest_comments.map((item)=>{
        const processed_replies:comment_type[]|null = item.replies?item.replies.map((reply)=>{
            return {
                comments:reply.comments,
                user_commenting:reply.user_commenting,
                likes:reply.likes
            }
        }):null;

        return {
            comments:item.comments,
            user_commenting:item.user_commenting,
            likes:item.likes,
            replies:processed_replies,
            profile_picture:item.profile_picture||null
        }
    }):null


    const tagged_users_processed:tagged_user[]|null = initial.tagged_users?initial.tagged_users.map((user)=>{
        return {
            full_name:user.full_name||null,
            id:user.id||null,
            is_verified:user.is_verified||null,
            profile_pic_url:user.profile_pic_url||null,
            username:user.username||null
        }
    }):null;

    const post_content_processed:content[]|null = initial.post_content?initial.post_content.map((content_item)=>{
        return {
            index:content_item.index||null,
            type:content_item.type||null,
            url:content_item.url||null,
            id:content_item.id||null,
            alt_text:content_item.alt_text||null
        }
    }):null;

    const video_duration_processed:video_duration[]|null = initial.videos_duration?initial.videos_duration.map((video_item)=>{
        return {
            url:video_item.url||null,
            duration:video_item.video_duration||null
        }
    }):null;

    const images_processed:image[]|null = initial.images?initial.images.map((image_item)=>{
        return {
            url:image_item.url||null,
            id:image_item.id||null
        }
    }):null;



    const outputData : ConvertedPostOutputType= {
        url:initial.url,
        user_posted:initial.user_posted||null,
        description:initial.description||null,
        hashtags:initial.hashtags||null,
        num_comments:initial.num_comments,
        shared:0, //instagram dont have shared
        saved:0, //instagram dont have saved
        likes:initial.likes||0,
        date_posted:initial.date_posted,
        photos:initial.photos||null,
        videos:initial.videos||null,
        post_id:initial.post_id||null,
        shortcode:initial.shortcode||null,
        content_type:initial.content_type||null,
        pk:initial.pk||null,
        content_id:initial.content_id||null,
        engagement_score_view:initial.engagement_score_view||0,
        thumbnail:initial.thumbnail||null,
        video_view_count:initial.video_view_count?Number(initial.video_view_count):0,
        product_type:initial.product_type||null,
        video_play_count:initial.video_play_count||0,
        followers:initial.followers||0,
        posts_count:initial.posts_count||0,
        profile_image_link:initial.profile_image_link||null,
        is_verified:initial.is_verified||null,
        is_paid_partnership:initial.is_paid_partnership||null,
        partnership_details:{
            profile_id:initial.partnership_details?.profile_id||null,
            username:initial.partnership_details?.username||null,
            profile_url:initial.partnership_details?.profile_url||null
        },
        user_posted_id:initial.user_posted_id||null,
        audio:{
            audio_asset_id:initial.audio?.audio_asset_id||null,
            original_audio_title:initial.audio?.original_audio_title||null,
            username:initial.audio?.ig_artist_username||null,
            artist_id:initial.audio?.ig_artist_id||null
        },
        profile_url:initial.profile_url||null,
        alt_text:initial.alt_text||null,
        photos_number:initial.photos_number||0,
        audio_url:initial.audio_url||null,
        timestamp:initial.timestamps||'',
        input:{
            url:initial.url
        },
        latest_comments:processed_lastest_comments,
        tagged_users:tagged_users_processed,
        post_content:post_content_processed,
        videos_duration:video_duration_processed,
        images:images_processed
    }

}

export const typeConverterV2 = (initial: InstagramPost_gd_lk5ns7kz21pck8jpis): ConvertedPostOutputType => {
    // Process latest comments
    const processed_lastest_comments = initial.latest_comments?.map((item) => ({
        comments: item.comments,
        user_commenting: item.user_commenting,
        likes: item.likes,
        replies: item.replies?.map((reply) => ({
            comments: reply.comments,
            user_commenting: reply.user_commenting,
            likes: reply.likes
        })) ?? null,
        profile_picture: item.profile_picture ?? null
    })) ?? null;

    // Process tagged users
    const tagged_users_processed = initial.tagged_users?.map((user) => ({
        full_name: user.full_name ?? null,
        id: user.id ?? null,
        is_verified: user.is_verified ?? null,
        profile_pic_url: user.profile_pic_url ?? null,
        username: user.username ?? null
    })) ?? null;

    // Process post content
    const post_content_processed = initial.post_content?.map((content_item) => ({
        index: content_item.index ?? null,
        type: content_item.type ?? null,
        url: content_item.url ?? null,
        id: content_item.id ?? null,
        alt_text: content_item.alt_text ?? null
    })) ?? null;

    // Process video duration
    const video_duration_processed = initial.videos_duration?.map((video_item) => ({
        url: video_item.url ?? null,
        duration: video_item.video_duration ?? null
    })) ?? null;

    // Process images
    const images_processed = initial.images?.map((image_item) => ({
        url: image_item.url ?? null,
        id: image_item.id ?? null
    })) ?? null;

    return {
        url: initial.url,
        user_posted: initial.user_posted ?? null,
        description: initial.description ?? null,
        hashtags: initial.hashtags ?? null,
        num_comments: initial.num_comments,
        shared: 0,
        saved: 0,
        likes: initial.likes ?? 0,
        date_posted: initial.date_posted,
        photos: initial.photos ?? null,
        videos: initial.videos ?? null,
        post_id: initial.post_id ?? null,
        shortcode: initial.shortcode ?? null,
        content_type: initial.content_type ?? null,
        pk: initial.pk ?? null,
        content_id: initial.content_id ?? null,
        engagement_score_view: initial.engagement_score_view ?? 0,
        thumbnail: initial.thumbnail ?? null,
        video_view_count: initial.video_view_count ? Number(initial.video_view_count) : 0,
        product_type: initial.product_type ?? null,
        video_play_count: initial.video_play_count ?? 0,
        followers: initial.followers ?? 0,
        posts_count: initial.posts_count ?? 0,
        profile_image_link: initial.profile_image_link ?? null,
        is_verified: initial.is_verified ?? null,
        is_paid_partnership: initial.is_paid_partnership ?? null,
        partnership_details: {
            profile_id: initial.partnership_details?.profile_id ?? null,
            username: initial.partnership_details?.username ?? null,
            profile_url: initial.partnership_details?.profile_url ?? null
        },
        user_posted_id: initial.user_posted_id ?? null,
        audio: {
            audio_asset_id: initial.audio?.audio_asset_id ?? null,
            original_audio_title: initial.audio?.original_audio_title ?? null,
            username: initial.audio?.ig_artist_username ?? null,
            artist_id: initial.audio?.ig_artist_id ?? null
        },
        profile_url: initial.profile_url ?? null,
        alt_text: initial.alt_text ?? null,
        photos_number: initial.photos_number ?? 0,
        audio_url: initial.audio_url ?? null,
        timestamp: initial.timestamps ?? '',
        input: {
            url: initial.url
        },
        latest_comments: processed_lastest_comments,
        tagged_users: tagged_users_processed,
        post_content: post_content_processed,
        videos_duration: video_duration_processed,
        images: images_processed
    };
};


// Helper function to safely extract error message
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
};
  
  // Helper function for logging error details
export const logError = (context: string, error: unknown): void => {
    if (error instanceof Error) {
        console.error(context, {
        message: error.message,
        stack: error.stack,
        name: error.name
        });
    } else {
        console.error(context, { error: String(error) });
    }
};