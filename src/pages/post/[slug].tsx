import { useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from "next/head";
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from "prismic-dom";

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../../components/Header';
import { ButtonExitPreview } from '../../components/ButtonExitPreview';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
	uid: string;
	first_publication_date: string | null;
	last_publication_date: string | null;
	data: {
		title: string;
		banner: {
		url: string;
		};
		author: string;
		content: {
		heading: string;
		body: {
			text: string;
		}[];
		}[];
	};
}

interface PostProps {
  	post: Post;
	preview: boolean;
	nextPost: Post;
	previousPost: Post;
}

// componente para os comentários
const Comments = ({
	commentNodeId
}) => {
	useEffect(() => {
	
		const script = document.createElement('script');
		script.src = 'https://utteranc.es/client.js';
		script.async = true;
		script.setAttribute('repo', 'lugb2/reactjs-capitulo-III-desafio-02-adicionando-features-ao-blog');
		script.setAttribute('issue-term', 'pathname');
		script.setAttribute('label', 'comment :speech_balloon:');
		script.setAttribute('theme', 'photon-dark');
		script.setAttribute('crossorigin', 'anonymous');
		const scriptParentNode = document.getElementById(commentNodeId);
		scriptParentNode.appendChild(script);
		
		return () => {
			// cleanup - remove the older script with previous theme
			scriptParentNode.removeChild(scriptParentNode.firstChild);
		};
	}, []);

	return <div id={commentNodeId} />;
};

export default function Post({ post, preview, nextPost, previousPost }: PostProps) {

	// router
	const router = useRouter();
	const commentsId = "inject-comments-for-uterances";
	
	// função para calcular tempo estimado de leitura
	const calcularTempoLeitura = () => {

		// prepara
		let totalTexto = 0;

		// percorrer conteúdos
		post.data.content.forEach((content) => {
			content.body.forEach((body) => {
				totalTexto += body.text.length
			})
		});

		// calcula tempo em segundos (+/- 18 letras por segundo)
		let totalTempoEstimado = totalTexto / 18;

		// retorna em minutos
		return Math.round(totalTempoEstimado / 60);
		
	}

	// se está no fallback do static
	if(router.isFallback){

		return <div className={commonStyles.loadingMessage}>
			Carregando...
		</div>;
	}

  	return (
		<>
			<Head>
				<title>{post.data.title} | spacetravelling</title>
			</Head>

			<Header />

			<div className={styles.banner}>
				<img src={post.data.banner.url} alt="banner" />
			</div>
			<main className={styles.container}>

				<div className={styles.post}>
					<h1>{post.data.title}</h1>
					<div className={commonStyles.info}>
						<span>
							<FiCalendar />
							<time>
								{format(
									new Date(post.first_publication_date),
									"dd MMM yyyy",
									{
										locale: ptBR,
									}
								)}
							</time>
						</span>
						<span>
							<FiUser />
							<span>{post.data.author}</span>
						</span>
						<span>
							<FiClock />
							<span>{calcularTempoLeitura()} min</span>
						</span>
					</div>
					{
						post.last_publication_date && <>
							<div className={[commonStyles.info, commonStyles.infoUpdate].join(' ')}>
								<i>
									* editado em <time>{format(
										new Date(post.last_publication_date),
										"dd MMM yyyy 'às' HH:mm",
										{
											locale: ptBR,
										}
									)}</time>
								</i>
							</div>
						</>
					}
					{
						post.data.content.map((content, i) => (
							<div key={i} className={styles.postContent}>
								<h2>{content.heading}</h2>
								<div
									className={styles.postContentContent}
									dangerouslySetInnerHTML={{
										__html: RichText.asHtml(content.body)
									}}
								/>
							</div>
						))
					}
				</div>
				
				<div className={styles.containerActions}>

					{
						(previousPost || nextPost) &&
						<div className={styles.navigatePosts}>
							{
								previousPost && <button
									className={styles.previousPost}
									onClick={() => {
										// navegar para o post anterior
										router.push(`/post/${previousPost.uid}`);
									}}
								>
									{previousPost.data.title}
									<span>Post anterior</span>
								</button>
							}
							{
								nextPost && <button
									className={styles.nextPost}
									onClick={() => {
										// navegar para o próximo post
										router.push(`/post/${nextPost.uid}`);
									}}
								>
									{nextPost.data.title}
									<span>Próximo post</span>
								</button>
							}
						</div>
					}

					<Comments
						commentNodeId={commentsId}
					/>

					{
						preview && <ButtonExitPreview />
					}

				</div>
			</main>
		</>
	)
}

export const getStaticPaths = async () => {
	const prismic = getPrismicClient();
	const response = await prismic.query([
		Prismic.predicates.at('document.type', 'posts')
	]);
	
	const paths = response.results.map((post) => ({
		params: {
			slug: post.uid
		}
	}));

	return {

		// passa parametros que devem ser criados como páginas estáticas no build
		paths,

		// true: carregar pelo browser
		// false: se não carregado, erro 404
		// 'blocking': carrega o conteúdo se não existir na camada do next
		fallback: true
	}
};

export const getStaticProps: GetStaticProps = async ({
	params,
	preview = false,
	previewData,
}) => {

	// pega o id
	const { slug } = params;
	let notFound = false;

	// consulta
	const prismic = getPrismicClient();
	let response = null;
	
	try{

		// consulta
		response = await prismic.getByUID('posts', String(slug), {
			ref: previewData?.ref ?? null
		});

		// verifica se encontrou
		if(!response){

			// não encontrado
			notFound = true;
		}

	}catch(e){
		// erro
		notFound = true;
	}

	// prepara
	let previousPost = null;
	let nextPost = null;

	try{

		// consulta
		const responsePreviousPost = await prismic.query(
			Prismic.predicates.at('document.type', 'posts'),
			{
				pageSize : 1,
				after : response.id,
				orderings: '[document.first_publication_date desc]',
				ref: previewData?.ref ?? null
			}
		);

		// pega
		previousPost = responsePreviousPost.results[0] || null;
	
	}catch(e){
		// não encontrado
	}


	try{

		// consulta
		const responseNextPost = await prismic.query(
			Prismic.predicates.at('document.type', 'posts'),
			{
				pageSize : 1,
				after: response.id,
				orderings: '[document.first_publication_date]',
				ref: previewData?.ref ?? null
			}
		);

		// altera
		nextPost = responseNextPost.results[0] || null;
		
	}catch(e){
		// não encontrado
	}

	// retorna
	return {
		props: {
			post: response,
			preview,
			nextPost,
			previousPost
		},
		notFound,
		revalidate: 60 * 30 // 30 minutos
	};
};