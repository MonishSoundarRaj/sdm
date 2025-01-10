import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DashboardPage } from './pages/Dashboard.page';
import { DatasetPage } from './pages/Dataset.page';
import { TrainPage } from './pages/Train.page';
import { GeneratePage } from './pages/Generate.page';
import { ArticleGridPage } from './pages/ArticleGrid.page';
import { ArticlePage } from './pages/Article.page';
import { AuthenticationFormPage } from './pages/Authentication.page';
import { TermsPage } from './pages/Terms.page';
import { SyntheticDataPage } from './pages/SyntheticData.page';
import { PrivateRoute } from './components/PrivateRoute/PrivateRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PrivateRoute element={<DashboardPage />} />,
  },
  {
    path: '/dataset',
    element: <PrivateRoute element={<DatasetPage />} />,
  },
  {
    path: '/train',
    element: <PrivateRoute element={<TrainPage />} />,
  },
  {
    path: '/generate',
    element: <PrivateRoute element={<GeneratePage />} />,
  },
  {
    path: '/articlegrid',
    element: <PrivateRoute element={<ArticleGridPage />} />,
  },
  {
    path: '/article/:id',
    element: <PrivateRoute element={<ArticlePage />} />,
  },
  {
    path: '/authentication',
    element: <AuthenticationFormPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/synthetic-data/:datasetName',
    element: <PrivateRoute element={<SyntheticDataPage />} />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
