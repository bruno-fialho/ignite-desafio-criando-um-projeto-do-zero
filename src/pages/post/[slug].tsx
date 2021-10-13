import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { RichText as RichTextReact, RichTextBlock } from 'prismic-reactjs';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useState } from 'react';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Header from '../../components/Header';

interface ContentProps {
  heading: string;
  body: RichTextBlock[];
}

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: ContentProps[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const wordRegex = /[\s,/]+/g;

  const [duration, setDuration] = useState(() => {
    const total = post?.data.content.reduce(
      (accumulator: number, current: ContentProps) =>
        accumulator + RichText.asText(current.body).split(wordRegex).length,
      0
    );

    return Math.ceil(total / 200);
  });

  if (router.isFallback) {
    return <h3>Carregando...</h3>;
  }

  return (
    <>
      <Head>
        <title>spacetraveling | {post.data.title}</title>
      </Head>

      <main className={styles.container}>
        <Header />

        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="banner" />
        </div>

        <div className={styles.post}>
          <strong>{post.data.title}</strong>

          <div className={styles.info}>
            <time>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyy', {
                locale: ptBR,
              })}
            </time>

            <p>
              <FiUser />
              {post.data.author}
            </p>

            <p>
              <FiClock />
              {duration} min
            </p>
          </div>

          {post.data.content.map(content => {
            return (
              <div key={content.heading?.slice(0, 10)} className={styles.body}>
                <h3>{content.heading}</h3>

                <RichTextReact render={content.body} />
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      {
        params: {
          slug: 'como-utilizar-hooks',
        },
      },
      {
        params: {
          slug: 'criando-um-app-cra-do-zero',
        },
      },
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post: Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  console.log(JSON.stringify(post, null, 2));

  return {
    props: {
      post,
    },
  };
};
