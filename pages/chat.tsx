import { Box } from '@mui/material';
import { GetStaticPropsContext, NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Head from 'next/head';
import { StoriesParams, StoryData } from 'storyblok-js-client';
import { SignUpBanner } from '../components/banner/SignUpBanner';
import CrispButton from '../components/crisp/CrispButton';
import Header, { HeaderProps } from '../components/layout/Header';
import StoryblokPageSection from '../components/storyblok/StoryblokPageSection';
import Storyblok, { useStoryblok } from '../config/storyblok';
import { LANGUAGES } from '../constants/enums';
import { useTypedSelector } from '../hooks/store';
import { getEventUserData } from '../utils/logEvent';

interface Props {
  story: StoryData;
  preview: boolean;
  sbParams: StoriesParams;
  locale: LANGUAGES;
}

const Chat: NextPage<Props> = ({ story, preview, sbParams, locale }) => {
  let configuredStory = useStoryblok(story, preview, sbParams, locale);
  const t = useTranslations('Courses');

  const userEmail = useTypedSelector((state) => state.user.email);
  const userToken = useTypedSelector((state) => state.user.token);
  const userCreatedAt = useTypedSelector((state) => state.user.createdAt);
  const partnerAccesses = useTypedSelector((state) => state.partnerAccesses);
  const partnerAdmin = useTypedSelector((state) => state.partnerAdmin);

  const headerProps: HeaderProps = {
    title: configuredStory.content.title,
    introduction: configuredStory.content.description,
    imageSrc: configuredStory.content.header_image.filename,
    translatedImageAlt: configuredStory.content.header_image.alt,
  };
  const eventUserData = getEventUserData(userCreatedAt, partnerAccesses, partnerAdmin);

  return (
    <>
      <Head>{headerProps.title}</Head>
      <Box>
        <Header
          {...headerProps}
          cta={
            userToken && (
              <CrispButton
                email={userEmail}
                eventData={eventUserData}
                buttonText={t('sessionDetail.chat.startButton')}
              />
            )
          }
        />
        {userToken ? (
          configuredStory.content.page_sections?.length > 0 &&
          configuredStory.content.page_sections.map((section: any, index: number) => (
            <StoryblokPageSection
              key={`page_section_${index}`}
              content={section.content}
              alignment={section.alignment}
              color={section.color}
            />
          ))
        ) : (
          <SignUpBanner />
        )}
      </Box>
    </>
  );
};

export async function getStaticProps({ locale, preview = false }: GetStaticPropsContext) {
  let sbParams = {
    version: preview ? 'draft' : 'published',
    language: locale,
    ...(preview && { cv: Date.now() }),
  };

  let { data } = await Storyblok.get(`cdn/stories/chat`, sbParams);
  return {
    props: {
      story: data ? data.story : null,
      preview,
      sbParams: JSON.stringify(sbParams),
      messages: {
        ...require(`../messages/shared/${locale}.json`),
        ...require(`../messages/navigation/${locale}.json`),
        ...require(`../messages/courses/${locale}.json`),
        ...require(`../messages/chat/${locale}.json`),
      },
      locale,
    },
    revalidate: 3600, // revalidate every hour
  };
}

export default Chat;
