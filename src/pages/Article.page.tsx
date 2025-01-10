import React from 'react';
import { useParams } from 'react-router-dom';
import { ArticleLayout } from '@/components/Article/ArticleLayout';
import { NavbarMinimal } from '@/components/Navbar/NavbarMinimal';
import classes from './Pages.module.css';

const test_content = `Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia,
molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum
numquam blanditiis harum quisquam eius sed odit fugiat iusto fuga praesentium
optio, eaque rerum! Provident similique accusantium nemo autem. Veritatis
obcaecati tenetur iure eius earum ut molestias architecto voluptate aliquam
nihil, eveniet aliquid culpa officia aut! Impedit sit sunt quaerat, odit,
tenetur error, harum nesciunt ipsum debitis quas aliquid. Reprehenderit,
quia. Quo neque error repudiandae fuga? Ipsa laudantium molestias eos 
sapiente officiis modi at sunt excepturi expedita sint? Sed quibusdam
recusandae alias error harum maxime adipisci amet laborum. Perspiciatis 
minima nesciunt dolorem! Officiis iure rerum voluptates a cumque velit 
quibusdam sed amet tempora. Sit laborum ab, eius fugit doloribus tenetur 
fugiat, temporibus enim commodi iusto libero magni deleniti quod quam 
consequuntur! Commodi minima excepturi repudiandae velit hic maxime
doloremque. Quaerat provident commodi consectetur veniam similique ad 
earum omnis ipsum saepe, voluptas, hic voluptates pariatur est explicabo 
fugiat, dolorum eligendi quam cupiditate excepturi mollitia maiores labore 
suscipit quas? Nulla, placeat. Voluptatem quaerat non architecto ab laudantium
modi minima sunt esse temporibus sint culpa, recusandae aliquam numquam 
totam ratione voluptas quod exercitationem fuga. Possimus quis earum veniam 
quasi aliquam eligendi, placeat qui corporis!`;


const articles = [
  {
    id: '1',
    title: 'GAN Architecture Explained',
    content: `
      <h2 id="usage">Usage</h2>
      <p>${test_content}</p>
      <p>${test_content}</p>
      <p>${test_content}</p>
      <p>${test_content}</p>
      <h2 id="position">Position and placement</h2>
      <p>${test_content}</p>
      <h2 id="overlays">With other overlays</h2>
      <p>${test_content}</p>
      <h2 id="focus">Manage focus</h2>
      <p>${test_content}</p>
      <h2 id="examples">Examples</h2>
      <p>${test_content}</p>
    `,
    author: 'Monish',
  },
];

export function ArticlePage() {
  const { id } = useParams();
  const article = articles.find((article) => article.id === id);

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className={classes.layout}>
      <NavbarMinimal />
      <div className={classes.content}>
        <ArticleLayout article={article} />
      </div>
    </div>
  );
}
